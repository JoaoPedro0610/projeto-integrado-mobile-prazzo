<#
.SYNOPSIS
    Sobe o emulador Android e o app PRAZZO de uma vez.

.DESCRIPTION
    Automatiza o roteiro completo, incluindo as tres armadilhas que ja
    custaram tempo neste projeto:

      1. ANDROID_HOME invalido. Uma instalacao do Flutter chegou a apontar
         essa variavel para "C:\dev\flutter\bin", onde nao existe adb. O
         script valida o caminho em vez de confiar na variavel.

      2. Porta 8081 presa. Se um Metro anterior foi morto sem encerrar, o
         processo node sobrevive segurando a porta e o `expo start` aborta
         com "Input is required" - ele tenta perguntar se pode usar a 8082
         e nao consegue, por nao ter terminal interativo.

      3. ram.img orfao. O emulador mapeia a RAM do convidado em disco, em
         snapshots\default_boot\ram.img, e NAO apaga esse arquivo ao sair.
         Sao sempre ~4 GB: esta system image (API 37, Play Store, paginas
         de 16 KB) ignora o hw.ramSize do config.ini e forca 4096 MB, o
         que o log do emulador anuncia como "Increasing RAM size to
         4096MB". Mexer no hw.ramSize nao muda esse custo.
         Disco cheio faz o boot seguinte falhar com
         "Not enough space to create userdata partition".

.PARAMETER SoEmulador
    Sobe apenas o emulador e sai, sem iniciar o Metro.

.PARAMETER Avd
    Nome do AVD. Padrao: Pixel_7.

.EXAMPLE
    .\start.ps1
    .\start.ps1 -SoEmulador
    powershell -ExecutionPolicy Bypass -File .\start.ps1
#>
[CmdletBinding()]
param(
    [switch]$SoEmulador,
    [string]$Avd = "Pixel_7"
)

$ErrorActionPreference = "Stop"

function Passo($texto) { Write-Host "==> $texto" -ForegroundColor Cyan }
function Aviso($texto) { Write-Host "    $texto" -ForegroundColor Yellow }
function Falha($texto) { Write-Host "!!! $texto" -ForegroundColor Red }
function Ok($texto)    { Write-Host "    $texto" -ForegroundColor Green }

<#
    Chama o adb e devolve so o stdout, ja limpo.

    Existe por um detalhe do PowerShell que quebra scripts silenciosamente:
    durante o boot o adb escreve "device offline" no stderr, e o PowerShell
    empacota stderr de executavel nativo num ErrorRecord. Com o
    $ErrorActionPreference = "Stop" la de cima, isso vira erro terminante e
    mata o script no meio da espera do boot.

    Redirecionar com 2>$null NAO resolve - e exatamente o redirecionamento
    que dispara o empacotamento. Passar por cmd.exe com "2>nul" descarta o
    stderr do lado de fora, antes de o PowerShell ver qualquer coisa.
#>
function Adb {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Argumentos)
    $linha = '"' + $script:adb + '" ' + ($Argumentos -join ' ') + ' 2>nul'
    $saida = & cmd.exe /c $linha
    if ($null -eq $saida) { return '' }
    return ([string]($saida -join "`n")).Trim()
}

# ------------------------------------------------------------------ SDK ---
Passo "Localizando o Android SDK"

$candidatos = @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
)

$sdk = $null
foreach ($c in $candidatos) {
    if ([string]::IsNullOrWhiteSpace($c)) { continue }
    # Valida pelo adb.exe: e o unico teste que pega um ANDROID_HOME apontando
    # para o lugar errado, que foi exatamente o caso do Flutter aqui.
    if (Test-Path (Join-Path $c 'platform-tools\adb.exe')) { $sdk = $c; break }
    Aviso "ignorando caminho sem platform-tools\adb.exe: $c"
}

if (-not $sdk) {
    Falha "Android SDK nao encontrado."
    Falha "Defina ANDROID_HOME para a pasta do SDK (a que contem platform-tools)."
    exit 1
}

$adb      = Join-Path $sdk 'platform-tools\adb.exe'
$emulador = Join-Path $sdk 'emulator\emulator.exe'
Ok "SDK: $sdk"

if (-not (Test-Path $emulador)) {
    Falha "emulator.exe nao encontrado em $sdk\emulator"
    exit 1
}

# ------------------------------------------------------------ processos ---
$emuAtivo = @(Get-Process -Name 'qemu-system-x86_64*' -ErrorAction SilentlyContinue).Count -gt 0

# ------------------------------------------------------- limpeza de disco --
$avdDir   = Join-Path $env:USERPROFILE ".android\avd\$Avd.avd"
$snapshot = Join-Path $avdDir 'snapshots\default_boot'

if ((-not $emuAtivo) -and (Test-Path $snapshot)) {
    $arquivos = @(Get-ChildItem $snapshot -File -ErrorAction SilentlyContinue)
    # Um snapshot legitimo tem varios arquivos (snapshot.pb, hardware.ini,
    # textures.bin...). So ram.img significa RAM abandonada por um processo
    # morto: lixo puro, e caro.
    $soRam = ($arquivos.Count -gt 0) -and (-not ($arquivos.Name -contains 'snapshot.pb'))
    if ($soRam) {
        $gb = [math]::Round((($arquivos | Measure-Object Length -Sum).Sum) / 1GB, 2)
        Passo "Removendo RAM orfa de um emulador morto ($gb GB)"
        Remove-Item $snapshot -Recurse -Force -ErrorAction SilentlyContinue
        Ok "espaco liberado"
    }
}

$livreGB = [math]::Round((Get-PSDrive C).Free / 1GB, 1)
if ($livreGB -lt 6) {
    Aviso "Disco C: com apenas $livreGB GB livres."
    Aviso "O emulador precisa de ~4 GB so para o ram.img. Se o boot falhar com"
    Aviso "'Not enough space to create userdata partition', libere espaco."
} else {
    Ok "disco C: $livreGB GB livres"
}

# -------------------------------------------------------- porta do Metro --
Passo "Verificando a porta 8081"
$presa = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($presa) {
    foreach ($conn in $presa) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq 'node') {
            Aviso "Metro orfao na 8081 (PID $($proc.Id)). Encerrando."
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 800
        } elseif ($proc) {
            Falha "Porta 8081 ocupada por '$($proc.ProcessName)' (PID $($proc.Id)), que nao e o Metro."
            Falha "Encerre esse processo antes de continuar."
            exit 1
        }
    }
    Ok "porta liberada"
} else {
    Ok "porta livre"
}

# ------------------------------------------------------------- emulador ---
if ($emuAtivo) {
    Passo "Emulador ja esta rodando - reaproveitando"
} else {
    Passo "Subindo o emulador ($Avd)"
    # -no-snapshot-load        : ignora estado salvo, que pode estar corrompido
    # -no-snapshot-save        : evita gravar o snapshot completo ao sair.
    #                            NAO impede o ram.img de ficar para tras -
    #                            disso cuida a limpeza no inicio do script.
    # -gpu swiftshader_indirect: o Vulkan da Intel UHD 620 e antigo demais
    # -no-boot-anim            : com render por software, a animacao custa caro
    $argumentos = @(
        '-avd', $Avd,
        '-no-snapshot-load',
        '-no-snapshot-save',
        '-no-boot-anim',
        '-gpu', 'swiftshader_indirect'
    )
    Start-Process -FilePath $emulador -ArgumentList $argumentos -WindowStyle Minimized

    # O emulator.exe e so um lancador: ele leva alguns segundos para criar o
    # processo qemu-system-x86_64 de verdade. Sem esta espera, a verificacao
    # de "processo vivo" logo abaixo roda antes do processo existir e aborta
    # com um falso negativo.
    Passo "Aguardando o processo do emulador aparecer"
    $apareceu = $false
    for ($i = 1; $i -le 20; $i++) {
        Start-Sleep -Seconds 3
        if (@(Get-Process -Name 'qemu-system-x86_64*' -ErrorAction SilentlyContinue).Count -gt 0) {
            $apareceu = $true
            break
        }
    }
    if (-not $apareceu) {
        Falha "O emulador nao chegou a iniciar em 60s."
        Falha "Rode o emulator.exe direto no terminal para ver a mensagem dele."
        exit 1
    }
    Ok "processo ativo"
}

# --------------------------------------------------------- esperar o boot -
Passo "Aguardando o Android terminar de iniciar"
Adb start-server | Out-Null

$pronto = $false
for ($i = 1; $i -le 100; $i++) {
    $vivo = @(Get-Process -Name 'qemu-system-x86_64*' -ErrorAction SilentlyContinue).Count -gt 0
    if (-not $vivo) {
        Falha "O processo do emulador desapareceu. Verifique disco e memoria."
        exit 1
    }

    $estado = Adb -s emulator-5554 shell getprop sys.boot_completed
    if ($estado -eq '1') {
        Ok "boot completo em ~$($i * 6)s"
        $pronto = $true
        break
    }
    Start-Sleep -Seconds 6
}

if (-not $pronto) {
    Falha "O emulador nao terminou de iniciar em 10 minutos."
    exit 1
}

# Espelha a porta 8081 do emulador na do PC. Assim o app usa
# exp://127.0.0.1:8081 e nao depende do IP da rede nem do firewall.
Adb -s emulator-5554 reverse tcp:8081 tcp:8081 | Out-Null

if ($SoEmulador) {
    Ok "Emulador pronto. Metro nao foi iniciado (-SoEmulador)."
    exit 0
}

# ----------------------------------------------------------------- Metro --
$appDir = Join-Path $PSScriptRoot 'app'
if (-not (Test-Path (Join-Path $appDir 'package.json'))) {
    Falha "Nao achei o app em $appDir"
    exit 1
}

if (-not (Test-Path (Join-Path $appDir 'node_modules'))) {
    Passo "Instalando dependencias (primeira execucao)"
    Push-Location $appDir
    npm install
    Pop-Location
}

# Exporta o SDK para o processo do Expo. Sem isso ele nao acha o adb e aborta
# com ENOENT: "O sistema nao pode encontrar o caminho especificado".
$env:ANDROID_HOME     = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:PATH = (Join-Path $sdk 'platform-tools') + ';' + (Join-Path $sdk 'emulator') + ';' + $env:PATH

Passo "Iniciando o Metro e abrindo o app"
Write-Host ""
Write-Host "    Dica: se o Expo Go fechar sozinho, tecle 'a' aqui para reabrir." -ForegroundColor DarkGray
Write-Host "    Ctrl+C encerra o Metro. O emulador continua aberto." -ForegroundColor DarkGray
Write-Host ""

Push-Location $appDir
try {
    npx expo start --android
} finally {
    Pop-Location
}
