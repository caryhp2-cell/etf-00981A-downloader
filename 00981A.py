"""00981A 統一台股增長主動式 ETF - 背景自動下載工具

依 CODE_REVIEW.md 改善：
  - 設定參數化（config.json）
  - 加入 logging 系統
  - except 改為具名例外
  - 加入 retry / 指數退避
  - 下載完成後驗證 Excel 檔案
  - 等待時間從 config 讀取
"""

import glob
import json
import logging
import os
import shutil
import sys
import time
from datetime import datetime

from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


# ---------------------------------------------------------------------------
# 路徑與設定載入
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")
LOG_DIR = os.path.join(SCRIPT_DIR, "logs")


def load_config(path=CONFIG_PATH):
    """讀取 config.json；若缺少則 raise，讓使用者立刻知道。"""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"找不到設定檔：{path}。請參考 README 建立 config.json。"
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Logging 設定
# ---------------------------------------------------------------------------
def setup_logger():
    """同時輸出到 console 與 logs/download.log。"""
    os.makedirs(LOG_DIR, exist_ok=True)
    log_file = os.path.join(LOG_DIR, "download.log")

    logger = logging.getLogger("etf_00981A")
    logger.setLevel(logging.INFO)
    if logger.handlers:
        return logger

    fmt = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(fmt)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(fmt)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger


logger = setup_logger()


# ---------------------------------------------------------------------------
# 環境檢查
# ---------------------------------------------------------------------------
def check_environment():
    """確認 Python 版本與必要套件存在。"""
    if sys.version_info < (3, 8):
        raise RuntimeError("需要 Python 3.8 或更新版本")

    for package in ("selenium", "openpyxl"):
        try:
            __import__(package)
        except ImportError as exc:
            raise RuntimeError(
                f"缺少必要套件：{package}，請執行 pip install -r requirements.txt"
            ) from exc

    logger.info("環境檢查通過")


# ---------------------------------------------------------------------------
# Retry helper
# ---------------------------------------------------------------------------
def retry_with_backoff(func, max_attempts, base_delay, description="操作"):
    """以指數退避重試。最後一次失敗會把例外往外拋。"""
    for attempt in range(1, max_attempts + 1):
        try:
            return func()
        except Exception as exc:
            if attempt == max_attempts:
                logger.error(f"{description}重試 {max_attempts} 次後仍失敗：{exc}")
                raise
            wait_time = base_delay ** attempt
            logger.warning(
                f"{description}第 {attempt}/{max_attempts} 次失敗，"
                f"{wait_time} 秒後重試：{exc}"
            )
            time.sleep(wait_time)


# ---------------------------------------------------------------------------
# 下載偵測 + 驗證
# ---------------------------------------------------------------------------
def wait_for_download(download_dir, before_files, timeout):
    """輪詢下載資料夾，等到沒有 .crdownload 且出現新 xlsx/xls 為止。"""
    end_time = time.time() + timeout
    while time.time() < end_time:
        partials = glob.glob(os.path.join(download_dir, "*.crdownload"))
        if not partials:
            current = set(os.listdir(download_dir))
            new_files = [
                f for f in (current - before_files)
                if f.lower().endswith((".xlsx", ".xls"))
            ]
            if new_files:
                return new_files
        time.sleep(1)
    return []


def validate_excel_file(filepath, min_size):
    """檢查檔案大小 + 用 openpyxl 開啟確認格式有效。"""
    import openpyxl

    size = os.path.getsize(filepath)
    if size < min_size:
        raise ValueError(f"檔案過小：{size} bytes（門檻 {min_size}）")

    workbook = openpyxl.load_workbook(filepath, read_only=True)
    try:
        sheet_count = len(workbook.sheetnames)
        if sheet_count == 0:
            raise ValueError("Excel 檔案無工作表")
    finally:
        workbook.close()

    logger.info(
        f"檔案驗證通過：{os.path.basename(filepath)}，"
        f"{size} bytes，{sheet_count} 個工作表"
    )


# ---------------------------------------------------------------------------
# WebDriver 建立
# ---------------------------------------------------------------------------
def build_driver(config, download_path):
    """建立 headless Chrome；失敗時給出較有幫助的錯誤訊息。"""
    chrome_cfg = config["chrome"]
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"--window-size={chrome_cfg['window_size']}")
    options.add_argument("--ignore-certificate-errors")
    options.add_argument(f"user-agent={chrome_cfg['user_agent']}")

    options.add_experimental_option(
        "prefs",
        {
            "download.default_directory": download_path,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True,
        },
    )

    try:
        driver = webdriver.Chrome(options=options)
    except WebDriverException as exc:
        logger.error(
            "啟動 Chrome WebDriver 失敗。請確認系統已安裝 Chrome，"
            "且 Selenium 版本 >= 4.6（內建 Selenium Manager 會自動下載 driver）。"
        )
        raise RuntimeError(f"WebDriver 初始化失敗：{exc}") from exc

    driver.execute_cdp_cmd(
        "Page.setDownloadBehavior",
        {"behavior": "allow", "downloadPath": download_path},
    )
    return driver


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------
def export_00981a_silent(config):
    url = config["url"]
    timeouts = config["timeouts"]
    selectors = config["selectors"]
    retry_cfg = config["retry"]
    validation_cfg = config["validation"]

    download_path = os.path.join(SCRIPT_DIR, config["download_subdir"])
    os.makedirs(download_path, exist_ok=True)

    driver = build_driver(config, download_path)
    before_files = set(os.listdir(download_path))

    try:
        logger.info(f"[靜默執行] 連線至：{url}")
        driver.get(url)
        wait = WebDriverWait(driver, timeouts["page_wait_seconds"])

        logger.info("[步驟 1/3] 切換分頁標籤")
        portfolio_tab = wait.until(
            EC.element_to_be_clickable((By.XPATH, selectors["portfolio_tab"]))
        )
        driver.execute_script("arguments[0].click();", portfolio_tab)

        time.sleep(timeouts["after_tab_click_seconds"])
        try:
            expand_btn = driver.find_element(By.XPATH, selectors["expand_btn"])
            driver.execute_script("arguments[0].click();", expand_btn)
            logger.info("[步驟 2/3] 已展開所有內容")
        except NoSuchElementException:
            logger.warning("[步驟 2/3] 展開按鈕不存在，略過（該按鈕為可選）")
        except WebDriverException as exc:
            logger.error(f"[步驟 2/3] 點擊展開按鈕時發生錯誤：{exc}")
            raise

        logger.info("[步驟 3/3] 尋找匯出按鈕並觸發下載")
        export_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, selectors["export_btn"]))
        )
        driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});", export_btn
        )
        time.sleep(timeouts["after_scroll_seconds"])
        driver.execute_script("arguments[0].click();", export_btn)
        logger.info(f"匯出已觸發；下載目錄：{download_path}")

        def _wait_and_validate():
            new_files = wait_for_download(
                download_path, before_files, timeouts["download_timeout_seconds"]
            )
            if not new_files:
                raise TimeoutException("下載逾時，未偵測到新的 XLSX 檔案")
            downloaded = new_files[0]
            src = os.path.join(download_path, downloaded)
            validate_excel_file(src, validation_cfg["min_file_size_bytes"])
            return src

        src = retry_with_backoff(
            _wait_and_validate,
            max_attempts=retry_cfg["max_attempts"],
            base_delay=retry_cfg["base_delay_seconds"],
            description="下載與驗證",
        )

        date_stamp = datetime.now().strftime("%Y-%m-%d")
        new_name = f"{config['file_prefix']}_{date_stamp}.xlsx"
        dst = os.path.join(download_path, new_name)
        if os.path.exists(dst):
            dst = os.path.join(
                download_path,
                f"{config['file_prefix']}_"
                f"{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.xlsx",
            )
        shutil.move(src, dst)
        logger.info(f"完成。檔案儲存為：{dst}")

    except Exception as exc:
        logger.error(f"執行失敗：{exc}")
        raise
    finally:
        driver.quit()
        logger.info("瀏覽器已關閉，任務結束")


def main():
    print("=" * 60)
    print(" 00981A 統一台股增長主動式 ETF - 背景自動下載工具 ")
    print("=" * 60)
    check_environment()
    config = load_config()
    export_00981a_silent(config)


if __name__ == "__main__":
    main()
