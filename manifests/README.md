<!-- File: manifests/README.md -->
# Manifests

## Fuente de verdad
- `nos.yaml`: schema del sistema NOs.

## Cómo se usa
- El agente lee `nos.yaml`.
- Crea/actualiza DBs idempotentemente.
- Luego crea relaciones y rollups.
