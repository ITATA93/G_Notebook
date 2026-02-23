<!-- File: docs/10_TROUBLESHOOTING.md -->
# Troubleshooting

## Error 404 / Not found
- La integración no tiene acceso a la página raíz.
- Se está apuntando a un ID incorrecto.
Acción: compartir de nuevo la página raíz `NOs` con la integración y re-ejecutar discovery.

## Error 403 / Forbidden
- Permisos insuficientes para crear DBs o editar schema.
Acción: revisar permisos de la integración.

## Relaciones no aparecen
- Orden incorrecto: crear relaciones antes de crear DB destino.
Acción: DBs primero, relaciones después. Reparar con prompt de repair.

## Rollup no calcula
- No hay datos o la propiedad base no existe.
Acción: verificar “✅ Done” en tareas y crear 2 tareas demo (una done).
