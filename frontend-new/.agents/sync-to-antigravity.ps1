# Sync universal agent registry to antigravity config
# antigravity uses .antigravity/agents/*.yaml files

param(
    [string]$RegistryPath = ".\.agents\registry\agents.yaml",
    [string]$OutputDir = ".\.antigravity\agents"
)

$registry = (Get-Content $RegistryPath -Raw) | ConvertFrom-Yaml

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

foreach ($agentName in $registry.agents.Keys) {
    $agent = $registry.agents[$agentName]
    $agentConfig = @{
        name = $agentName
        description = $agent.description
        mode = $agent.mode
        capabilities = $agent.capabilities
    }
    $agentConfig | ConvertTo-Yaml | Set-Content -Path "$OutputDir\$agentName.yaml" -Encoding UTF8
}

# Dynamic agent template
$templateConfig = @{
    name = "*"
    description = $registry.dynamic_agent_template.description
    mode = $registry.dynamic_agent_template.mode
    capabilities = $registry.dynamic_agent_template.capabilities
}
$templateConfig | ConvertTo-Yaml | Set-Content -Path "$OutputDir\_dynamic.yaml" -Encoding UTF8

Write-Host "Synced $($registry.agents.Count) agents to $OutputDir" -ForegroundColor Green
