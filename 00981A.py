# 安裝最新版 Python 3.12
# pip install selenium

import time
import os
import glob
import shutil
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def wait_for_download(download_dir, before_files, timeout=60):
    """Poll the download directory until a new file finishes downloading
    (no .crdownload partial file left and at least one new file present)."""
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


def export_00981a_silent():
    url = "https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=49YTW"

    # 1. 下載路徑改為 repo 內的 downloads 資料夾（相對於本檔案位置）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    download_path = os.path.join(script_dir, "downloads")
    os.makedirs(download_path, exist_ok=True)

    options = Options()
    # 無頭模式 (CI 環境必須)
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--ignore-certificate-errors")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    prefs = {
        "download.default_directory": download_path,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
    }
    options.add_experimental_option("prefs", prefs)

    driver = webdriver.Chrome(options=options)

    # 在 headless 模式下，必須透過 CDP 指令允許下載行為
    driver.execute_cdp_cmd(
        "Page.setDownloadBehavior",
        {"behavior": "allow", "downloadPath": download_path},
    )

    # 記錄下載前已經存在的檔案，方便事後辨識新檔
    before_files = set(os.listdir(download_path))

    try:
        print(f">>> [靜默執行] 正在連線至：{url}")
        driver.get(url)
        wait = WebDriverWait(driver, 20)

        # 2. 切換至投資組合
        print(">>> [步驟 1/3] 正在切換分頁標籤...")
        portfolio_tab = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[contains(text(), '投資組合')]")
            )
        )
        driver.execute_script("arguments[0].click();", portfolio_tab)

        # 3. 點擊展開全部
        time.sleep(2)
        try:
            expand_btn = driver.find_element(
                By.XPATH, "//button[contains(., '展開全部')]"
            )
            driver.execute_script("arguments[0].click();", expand_btn)
            print(">>> [步驟 2/3] 已展開所有內容。")
        except Exception:
            pass

        # 4. 下載 Excel
        print(">>> [步驟 3/3] 正在尋找匯出按鈕並觸發下載...")
        export_btn = wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., '匯出XLSX檔')]")
            )
        )
        driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});", export_btn
        )
        time.sleep(1)
        driver.execute_script("arguments[0].click();", export_btn)

        print(f"\n★ 點擊成功！等待檔案下載至：\n{download_path}")

        new_files = wait_for_download(download_path, before_files, timeout=60)
        if not new_files:
            raise RuntimeError("下載逾時，未偵測到新的 XLSX 檔案")

        # 5. 重新命名為日期戳記，避免每日覆寫
        downloaded = new_files[0]
        date_stamp = datetime.now().strftime("%Y-%m-%d")
        new_name = f"00981A_{date_stamp}.xlsx"
        src = os.path.join(download_path, downloaded)
        dst = os.path.join(download_path, new_name)
        # 同一天重跑時，加上時分秒避免覆蓋
        if os.path.exists(dst):
            dst = os.path.join(
                download_path,
                f"00981A_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.xlsx",
            )
        shutil.move(src, dst)
        print(f"\n★ 完成。檔案儲存為：{dst}")

    except Exception as e:
        print(f"\n【錯誤細節】：{e}")
        raise  # 讓 GitHub Actions 知道這次執行失敗
    finally:
        driver.quit()
        print("\n>>> 任務完成，瀏覽器已自動關閉。")


if __name__ == "__main__":
    print("=" * 60)
    print(" 00981A 統一台股增長主動式 ETF - 背景自動下載工具 ")
    print("=" * 60)
    export_00981a_silent()
