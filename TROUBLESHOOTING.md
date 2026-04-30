# 疑難排解

## 安裝相關

### `RuntimeError: 缺少必要套件：selenium / openpyxl`

沒裝相依套件。執行：

```bash
pip install -r requirements.txt
```

如果在 CI 環境，確認 workflow 有跑 `pip install -r requirements.txt` 這個步驟。

### `RuntimeError: 需要 Python 3.8 或更新版本`

升級 Python。本專案在 GitHub Actions 用 Python 3.12。

## WebDriver 相關

### `RuntimeError: WebDriver 初始化失敗`

最常見原因：

- **沒裝 Chrome**：`google-chrome --version` 沒輸出 → 先安裝 Chrome
- **Selenium 版本過舊**：本專案需要 Selenium 4.6+（內建 Selenium Manager 會自動下載對應 chromedriver）
- **企業環境阻擋下載**：Selenium Manager 預設會從 GitHub 下載 chromedriver，公司網路可能擋。可改手動指定 chromedriver 路徑

確認版本：

```bash
python -c "import selenium; print(selenium.__version__)"
google-chrome --version
```

### `chromedriver only supports Chrome version XXX`

Chrome 升級了但 chromedriver 沒跟上。Selenium Manager 通常會自動處理；若沒有，刪掉 `~/.cache/selenium` 後重跑：

```bash
rm -rf ~/.cache/selenium
python 00981A.py
```

## 下載相關

### `TimeoutException: 下載逾時，未偵測到新的 XLSX 檔案`

可能原因：

1. **網站變慢**：把 `config.json` 的 `timeouts.download_timeout_seconds` 調大（例如 90）
2. **匯出按鈕沒被點到**：到 [ezmoney 頁面](https://www.ezmoney.com.tw/ETF/Fund/Info?fundCode=49YTW)看「匯出XLSX檔」按鈕文字是否還一樣，若改了就更新 `selectors.export_btn`
3. **網站擋 headless**：移除 `00981A.py` 裡的 `--headless=new` 看一下實際畫面

### `ValueError: 檔案過小：XXX bytes`

下載到的檔案不完整或是錯誤頁。可調 `config.json` 的 `validation.min_file_size_bytes`，或先確認 ezmoney 是不是出了問題。

### `ValueError: Excel 檔案無工作表`

檔案不是有效的 xlsx。同上，多半是網站回了空檔或錯誤頁面。

## XPath / 選擇器相關

### `TimeoutException` 在「步驟 1/3 切換分頁標籤」就掛掉

XPath 抓不到「投資組合」分頁。檢查 `config.json` 的 `selectors.portfolio_tab` 是否仍對應頁面實際元素。

ezmoney 改版時，需要對應更新：

```json
"selectors": {
  "portfolio_tab": "//a[contains(text(), '投資組合')]",
  "expand_btn":   "//button[contains(., '展開全部')]",
  "export_btn":   "//button[contains(., '匯出XLSX檔')]"
}
```

### `[步驟 2/3] 展開按鈕不存在，略過`

這只是 WARNING 不是錯誤——如果頁面預設已經展開，沒有「展開全部」按鈕是正常的，程式會繼續往下走。

## GitHub Actions 相關

### Workflow 跑失敗，看不到日誌

- Actions 頁面 → 點失敗的 run → 展開「Run downloader」步驟看 console 輸出
- 程式同時把日誌寫到 `logs/download.log`，但這個檔案在 ephemeral runner 上、不會 commit 回 repo

### 排程沒觸發

GitHub 對 cron 觸發不保證準時，有時延遲幾分鐘到一小時都有可能。可改在 Actions 頁面手動 `workflow_dispatch` 觸發測試。

### push 失敗：`Permission denied`

`download.yml` 用了 `permissions: contents: write`。如果 organization 鎖了預設 token 權限，需要在 repo 設定 → Actions → General → Workflow permissions 改成 **Read and write permissions**。

## 日誌位置

- Console：直接 print 出來，CI 上會出現在 Actions log
- 檔案：`logs/download.log`（被 `.gitignore` 排除，不會 commit）
