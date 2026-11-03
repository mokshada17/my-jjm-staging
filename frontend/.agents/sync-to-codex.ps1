# Sync universal agent registry to Codex config
# Codex uses .codex/agents.json or similar

param(
    [string]$RegistryPath = ".\.agents\registry\agents.yaml",
    [string]$OutputPath = ".\.codex\agents.json"
)

$registry = (Get-Content $RegistryPath -Raw) | ConvertFrom-Yaml

$config = @{
    version = "1.0"
    default_agent = "tech-lead"
    agents = @{}
}

foreach ($agentName in $registry.agents.Keys) {
    $agent = $registry.agents[$agentName]
    $config.agents[$agentName] = @{
        description = $agent.description
        mode = $agent.mode
        capabilities = $agent.capabilities
    }
}

# Dynamic agent support
$config.agents["*"] = @{
    description = $registry.dynamic_agent_template.description
    mode = $registry.dynamic_agent_template.mode
    capabilities = $registry.dynamic_agent_template.capabilities
}

$config | ConvertTo-Json -Depth 10 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "Synced to $OutputPath" -ForegroundColor Green
