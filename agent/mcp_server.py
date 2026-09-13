"""Read-only MCP catalogue: a scoped snapshot, no database or API credentials."""
import json
import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Synthetic commerce catalogue")
snapshot = json.loads(os.environ["CATALOG_SNAPSHOT"])

@mcp.tool()
def get_order() -> dict:
    """Read the single synthetic order scoped to this investigation."""
    return snapshot["order"]

@mcp.tool()
def get_policies() -> list[dict]:
    """Read all versioned demonstration policies, including conflict handling."""
    return snapshot["policies"]

if __name__ == "__main__":
    mcp.run(transport="stdio")
