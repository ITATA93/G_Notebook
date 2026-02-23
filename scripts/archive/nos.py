#!/usr/bin/env python3
"""
NOs - Unified CLI for Notion Operating System
Provides a single entry point for all system operations
"""
import sys
import argparse
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__) / "scripts"))

from scripts.config import DB_IDS, NOTION_API_VERSION


def main():
    parser = argparse.ArgumentParser(
        description="NOs - Notion Operating System CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Deploy system
  python nos.py deploy <NOTION_TOKEN>
  
  # Sync from Canvas
  python nos.py sync --source canvas --token <CANVAS_TOKEN> --notion <NOTION_TOKEN>
  
  # Sync from Gmail
  python nos.py sync --source gmail --notion <NOTION_TOKEN>
  
  # Enrich demo data
  python nos.py enrich <NOTION_TOKEN>
  
  # Diagnose system
  python nos.py diagnose <NOTION_TOKEN> --verbose
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Deploy command
    deploy_parser = subparsers.add_parser('deploy', help='Deploy NOs system to Notion')
    deploy_parser.add_argument('token', help='Notion integration token')
    deploy_parser.add_argument('--skip-relations', action='store_true', help='Skip relation creation')
    deploy_parser.add_argument('--skip-enrichment', action='store_true', help='Skip data enrichment')
    
    # Sync command
    sync_parser = subparsers.add_parser('sync', help='Sync data from external sources')
    sync_parser.add_argument('--source', required=True, choices=['canvas', 'gmail'], help='Data source')
    sync_parser.add_argument('--notion', required=True, help='Notion token')
    sync_parser.add_argument('--token', help='Source-specific token (Canvas token)')
    sync_parser.add_argument('--url', help='Canvas URL (default: uandes.instructure.com)')
    sync_parser.add_argument('--dry-run', action='store_true', help='Preview changes without applying')
    
    # Enrich command
    enrich_parser = subparsers.add_parser('enrich', help='Enrich demo data')
    enrich_parser.add_argument('token', help='Notion integration token')
    
    # Diagnose command
    diagnose_parser = subparsers.add_parser('diagnose', help='Diagnose system health')
    diagnose_parser.add_argument('token', help='Notion integration token')
    diagnose_parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    # Info command
    info_parser = subparsers.add_parser('info', help='Show system information')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Route to appropriate handler
    if args.command == 'deploy':
        from scripts.core.deploy import main as deploy_main
        sys.argv = ['deploy.py', args.token]
        deploy_main()
    
    elif args.command == 'sync':
        if args.source == 'canvas':
            from scripts.sync.canvas import sync_unified
            if not args.token:
                print("❌ Canvas sync requires --token argument")
                sys.exit(1)
            sync_unified(args.token, args.notion, args.url)
        elif args.source == 'gmail':
            from scripts.sync.gmail import sync_unified
            sync_unified(args.notion)
    
    elif args.command == 'enrich':
        from scripts.core.enrich_data import enrich_data
        from notion_client import Client
        client = Client(auth=args.token)
        enrich_data(client)
    
    elif args.command == 'diagnose':
        print(f"🔍 Diagnosing NOs system...")
        print(f"   API Version: {NOTION_API_VERSION}")
        print(f"   Databases: {len(DB_IDS)}")
        for db_key in DB_IDS:
            print(f"      - {db_key}")
        if args.verbose:
            print("\n📋 Database IDs:")
            for db_key, db_id in DB_IDS.items():
                print(f"   {db_key}: {db_id}")
    
    elif args.command == 'info':
        print("NOs - Notion Operating System")
        print(f"Version: 1.0.0")
        print(f"Databases: {len(DB_IDS)}")
        print(f"API Version: {NOTION_API_VERSION}")
        print("\nFor detailed documentation, see: project_memory.md")


if __name__ == "__main__":
    main()
