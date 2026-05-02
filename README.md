# 00981A ETF 自動下載器

每日自動從 [ezmoney](https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=49YTW) 下載「統一台股增長主動式 ETF（00981A）」的投資組合 XLSX 檔，並 commit 回 repo。

## 功能特色

- 無頭模式（headless）跑 Selenium，可在 GitHub Actions 上執行
- 設定全部抽到 `config.json`，不用改程式碼就能調整
- 完整 logging，紀錄寫到 `logs/download.log`
- 下載完成後驗證 Excel 檔案（檔案大小 + openpyxl 開啟）
- 失敗自動重試（指數退避）
- 以檔案內 A1 的實際資料日期命名，假日下載到重複資料時自動略過

## 安裝

需要 Python 3.8 以上、Google Chrome（Selenium 4.6+ 內建 Selenium Manager 會自動下載對應的 chromedriver）。

```bash
git clone https://github.com/caryhp2-cell/etf-00981A-downloader.git
cd etf-00981A-downloader
pip install -r requirements.txt
```

## 使用方式

### 本機執行

```bash
python 00981A.py
```

下載完成後檔案會以 `00981A_YYYY-MM-DD.xlsx` 命名儲存在 `downloads/` 資料夾。
日誌寫到 `logs/download.log`。

### 自動排程（GitHub Actions）

`.github/workflows/download.yml` 已設定每天台北時間 18:00（UTC 10:00）自動執行，
也可以在 Actions 頁面手動觸發 workflow。

## 設定（config.json）

| 欄位 | 說明 |
|---|---|
| `url` | 目標頁面 URL |
| `download_subdir` | 下載資料夾名稱（相對於程式所在目錄） |
| `file_prefix` | 檔名前綴 |
| `timeouts.page_wait_seconds` | `WebDriverWait` 等待元素出現的秒數 |
| `timeouts.download_timeout_seconds` | 等待下載完成的秒數 |
| `timeouts.after_tab_click_seconds` | 切換分頁後固定等待的秒數 |
| `timeouts.after_scroll_seconds` | scrollIntoView 後等待的秒數 |
| `retry.max_attempts` | 下載 + 驗證失敗時的重試次數 |
| `retry.base_delay_seconds` | 指數退避底數（每次重試等 base^attempt 秒） |
| `validation.min_file_size_bytes` | 視為「下載失敗」的檔案大小門檻 |
| `selectors.*` | XPath 選擇器；當網站 DOM 變更時改這裡，不用動程式碼 |
| `chrome.user_agent`、`chrome.window_size` | 啟動 Chrome 的選項 |

## 專案結構

```
etf-00981A-downloader/
├── 00981A.py               主程式
├── config.json             所有可調整的設定
├── requirements.txt        Python 套件相依
├── downloads/              下載的 XLSX 存放處
├── logs/                   執行紀錄
├── CODE_REVIEW.md          內部 code review 報告
├── TROUBLESHOOTING.md      常見問題排查
└── .github/workflows/      GitHub Actions 排程
```

## 疑難排解

請看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。
