# 代碼審核報告 - ETF 下載器

**審核日期：** 2026-04-30  
**審核員：** Claude  
**審核對象：** `00981A.py`

---

## 概述

整體來說，這是一個功能完整的網頁自動化下載工具，用於從 ezmoney 網站下載 00981A ETF 數據。代碼結構清晰、中文註解詳細，具有完整的錯誤處理和資源管理。

---

## 🔴 高優先級 (Critical)

### 1. 硬編碼配置值 - 應該參數化
**問題：** URL、timeout、選擇器等硬編碼在代碼中，修改需要編輯源代碼
```python
# 當前：
url = "https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=49YTW"
timeout=60
```

**改善建議：**
- 創建 `config.json` 或 `.env` 文件
- 將 URL、timeout、XPath 分離到配置文件
- 便於不同環境和 CI/CD 工作流調整

**示例結構：**
```json
{
  "url": "https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=49YTW",
  "timeout": 60,
  "download_timeout": 60,
  "selectors": {
    "portfolio_tab": "//a[contains(text(), '投資組合')]",
    "expand_btn": "//button[contains(., '展開全部')]",
    "export_btn": "//button[contains(., '匯出XLSX檔')]"
  }
}
```

---

### 2. 缺少 WebDriver 管理
**問題：** 沒有指定 ChromeDriver 路徑，不同系統或 Chrome 版本可能失敗
```python
# 當前：
driver = webdriver.Chrome(options=options)
```

**可能的失敗情形：**
- Chrome 版本升級後 WebDriver 不匹配
- 系統中未安裝 ChromeDriver
- PATH 未配置 ChromeDriver

**改善建議：**
- 使用 `webdriver-manager` 自動下載匹配版本
- 或添加清晰的錯誤提示和安裝指導

**推薦方案：**
```python
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)
```

---

### 3. 異常處理過於寬泛
**問題：** 第 97-98 行的異常處理隱藏錯誤
```python
try:
    expand_btn = driver.find_element(By.XPATH, "//button[contains(., '展開全部')]")
    driver.execute_script("arguments[0].click();", expand_btn)
    print(">>> [步驟 2/3] 已展開所有內容。")
except Exception:
    pass  # ❌ 無聲失敗，難以除錯
```

**改善建議：**
- 分別捕獲不同異常類型
- 至少記錄警告日誌而不是無聲失敗
- 區分「元素不存在」（可選）和其他錯誤（必須報告）

**改進方案：**
```python
try:
    expand_btn = driver.find_element(By.XPATH, "//button[contains(., '展開全部')]")
    driver.execute_script("arguments[0].click();", expand_btn)
    print(">>> [步驟 2/3] 已展開所有內容。")
except NoSuchElementException:
    logger.warning("展開按鈕不存在，繼續執行（該按鈕為可選）")
except Exception as e:
    logger.error(f"展開時發生意外錯誤：{e}")
    raise
```

---

## 🟡 中優先級 (Important)

### 4. 缺少日誌系統
**問題：** 只使用 `print()`，無法持久化記錄和管理
- 無法區分日誌級別（INFO、WARNING、ERROR）
- 執行後無記錄可追蹤
- CI/CD 環境中難以檢查過往執行

**改善建議：**
```python
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/download.log'),
        logging.StreamHandler()
    ]
)

# 使用：
logger.info("正在連線至：{url}")
logger.warning("展開按鈕不存在")
logger.error("下載失敗：{error}")
```

---

### 5. 無重試機制
**問題：** 下載或任何步驟失敗一次就報錯，不夠穩健
```python
new_files = wait_for_download(download_path, before_files, timeout=60)
if not new_files:
    raise RuntimeError("下載逾時，未偵測到新的 XLSX 檔案")  # 直接失敗
```

**改善建議：**
- 添加重試邏輯（例如 3 次重試）
- 指數退避等待時間
- 記錄每次重試的信息

**示例：**
```python
def retry_with_backoff(func, max_retries=3, base_delay=2):
    for attempt in range(1, max_retries + 1):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries:
                raise
            wait_time = base_delay ** attempt
            logger.warning(f"第 {attempt} 次失敗，{wait_time} 秒後重試：{e}")
            time.sleep(wait_time)
```

---

### 6. 等待時間硬編碼
**問題：** `time.sleep(2)`、`timeout=60` 等無法動態調整
```python
time.sleep(2)  # 為何是 2 秒？
wait = WebDriverWait(driver, 20)  # 為何是 20 秒？
timeout=60  # 為何是 60 秒？
```

**改善建議：**
- 提取為配置變量
- 根據網絡狀況靈活調整
- 添加文檔說明每個值的含義

---

### 7. 下載驗證不完整
**問題：** 只檢查文件是否存在，未驗證內容
```python
new_files = wait_for_download(download_path, before_files, timeout=60)
if not new_files:
    raise RuntimeError("下載逾時...")
# ❌ 此時只知道文件存在，不知道是否完整
```

**改善建議：**
```python
def validate_excel_file(filepath):
    """驗證下載的 Excel 文件是否有效"""
    try:
        # 檢查文件大小
        size = os.path.getsize(filepath)
        if size < 1024:  # 小於 1KB 可能異常
            raise ValueError(f"文件過小：{size} 字節")
        
        # 驗證 Excel 格式
        import openpyxl
        workbook = openpyxl.load_workbook(filepath)
        if not workbook.sheetnames:
            raise ValueError("Excel 文件無工作表")
        
        logger.info(f"✓ 文件驗證成功：{size} 字節，{len(workbook.sheetnames)} 個工作表")
        return True
    except Exception as e:
        logger.error(f"✗ 文件驗證失敗：{e}")
        raise
```

---

## 🟢 低優先級 (Nice to Have)

### 8. 缺少依賴版本鎖定
**當前：**
```txt
selenium>=4.15
```

**改善建議：** 使用固定版本，確保重現性
```txt
selenium==4.15.2
webdriver-manager==4.0.1
openpyxl==3.10.0
python-dotenv==1.0.0
```

---

### 9. 無環境檢查
**改善建議：** 添加啟動檢查函數
```python
def check_environment():
    """檢查執行環境是否滿足要求"""
    required_packages = ['selenium', 'openpyxl']
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            raise RuntimeError(f"缺少必要套件：{package}，請執行 pip install -r requirements.txt")
    
    # 檢查 Python 版本
    import sys
    if sys.version_info < (3, 8):
        raise RuntimeError("需要 Python 3.8 或更新版本")
    
    logger.info("✓ 環境檢查通過")
```

---

### 10. 缺少超時保護
**改善建議：** 添加全局超時機制防止無限等待
```python
import signal

def timeout_handler(signum, frame):
    raise TimeoutError("整體執行逾時")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(300)  # 5 分鐘全局超時
```

---

### 11. 錯誤消息不夠詳細
**改善建議：** 在關鍵步驟前後添加詳細日誌
```python
logger.debug(f"Chrome 選項：{options.arguments}")
logger.debug(f"下載路徑：{download_path}")
logger.debug(f"下載前文件：{before_files}")
```

---

### 12. 缺少配置文檔
**建議添加：**
- ✗ README.md - 使用指南和安裝步驟
- ✗ SETUP.md - 環境配置詳細說明
- ✗ TROUBLESHOOTING.md - 常見問題和解決方案

---

## ✅ 做得好的地方

- ✅ **合理使用 WebDriverWait** - 不用 `time.sleep()` 等待元素加載
- ✅ **使用 CDP 命令** - 在 headless 模式下正確啟用下載
- ✅ **聰明的文件去重機制** - 日期戳記 + 時分秒避免覆蓋
- ✅ **清晰的中文註解** - 易於理解每個步驟
- ✅ **完整的資源清理** - `driver.quit()` 在 finally 塊中確保執行
- ✅ **良好的用戶反饋** - 清晰的進度提示和完成消息

---

## 優先改進建議

按照優先級順序，建議改進順序：

1. **配置參數化** - 降低維護成本
2. **日誌系統** - 便於調試和監控
3. **WebDriver 管理** - 提高跨系統兼容性
4. **重試機制** - 提高可靠性
5. **文件驗證** - 確保下載成功
6. **文檔** - 便於其他開發者使用

---

## 修改建議總結

| 項目 | 優先級 | 預期工作量 | 改善效果 |
|-----|--------|---------|--------|
| 配置參數化 | 🔴 | 中 | 高 |
| WebDriver 管理 | 🔴 | 低 | 高 |
| 異常處理改進 | 🔴 | 低 | 中 |
| 日誌系統 | 🟡 | 中 | 高 |
| 重試機制 | 🟡 | 中 | 高 |
| 文件驗證 | 🟡 | 低 | 中 |
| 版本鎖定 | 🟢 | 低 | 低 |
| 環境檢查 | 🟢 | 低 | 中 |
| 文檔 | 🟢 | 中 | 高 |

---

**總體評分：7.5/10**
- 功能完整度：9/10
- 代碼質量：7/10
- 可維護性：6/10
- 可靠性：6/10
- 文檔完整度：3/10
