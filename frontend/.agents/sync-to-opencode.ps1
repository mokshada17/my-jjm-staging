# Sync universal agent registry to opencode.json
# Run this after editing .agents/registry/agents.yaml

param(
    [string]$RegistryPath = ".\.agents\registry\agents.yaml",
    [string]$OutputPath = ".\opencode.json"
)

$registry = (Get-Content $RegistryPath -Raw) | ConvertFrom-Yaml

$config = @{
    '$schema' = "https://opencode.ai/config.json"
    default_agent = "tech-lead"
    agent = @{}
    permission = $registry.defaults.permissions
    references = @{
        architecture = @{ path = "docs/architecture"; description = "Architecture decision records, system designs" }
        security = @{ path = "docs/security"; description = "Threat models, security requirements, compliance docs" }
        testing = @{ path = "docs/testing"; description = "Test plans, strategies, quality metrics" }
    }
}

foreach ($agentName in $registry.agents.Keys) {
    $agent = $registry.agents[$agentName]
    $config.agent[$agentName] = @{
        mode = $agent.mode
        description = $agent.description
    }
}

# Add wildcard for dynamic agents
$config.agent["*"] = @{
    mode = $registry.dynamic_agent_template.mode
    description = $registry.dynamic_agent_template.description
}

$config | ConvertTo-Json -Depth 10 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "Synced to $OutputPath" -ForegroundColor Green
