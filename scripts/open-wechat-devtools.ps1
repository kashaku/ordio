$projectRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $projectRoot 'dist\dev\mp-weixin'

if (-not (Test-Path -LiteralPath (Join-Path $projectPath 'project.config.json'))) {
  throw 'WeChat Mini Program output was not found. Run npm run dev:mp-weixin first.'
}

$wechatFolder = -join @(
  [char]0x5FAE,
  [char]0x4FE1,
  'web',
  [char]0x5F00,
  [char]0x53D1,
  [char]0x8005,
  [char]0x5DE5,
  [char]0x5177
)

$wechatFolderShort = -join @(
  [char]0x5FAE,
  [char]0x4FE1,
  [char]0x5F00,
  [char]0x53D1,
  [char]0x8005,
  [char]0x5DE5,
  [char]0x5177
)

$candidates = @()
if ($env:WECHAT_DEVTOOLS_CLI) {
  $candidates += $env:WECHAT_DEVTOOLS_CLI
}
$candidates += @(
  (Join-Path 'D:\' "$wechatFolder\cli.bat"),
  (Join-Path 'C:\Program Files (x86)\Tencent' "$wechatFolder\cli.bat"),
  (Join-Path 'C:\Program Files\Tencent' "$wechatFolderShort\cli.bat"),
  (Join-Path 'C:\Program Files (x86)\Tencent' "$wechatFolderShort\cli.bat")
)

$cli = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $cli) {
  throw 'WeChat DevTools CLI was not found. Set WECHAT_DEVTOOLS_CLI to cli.bat.'
}

& $cli open --project $projectPath --lang zh
exit $LASTEXITCODE
