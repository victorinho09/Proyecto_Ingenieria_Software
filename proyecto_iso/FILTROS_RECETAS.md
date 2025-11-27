# Sistema de Filtrado de Recetas

## Descripción

Se ha implementado un sistema completo de filtrado para la sección **"Mis Recetas"** que permite a los usuarios filtrar sus recetas según múltiples criterios.

## Características Implementadas

### 1. Botón de Filtros
- **Ubicación**: En la cabecera de la sección "Mis Recetas", junto al contador de recetas
- **Icono**: Funnel (embudo) de Bootstrap Icons
- **Función**: Abre el modal de filtros al hacer clic

### 2. Modal de Filtros

El modal contiene los siguientes filtros:

#### Filtros de Texto Libre (búsqueda por coincidencia parcial)
- **Ingredientes**: Busca recetas que contengan el ingrediente especificado (case-insensitive)

#### Filtros con Valores Fijos (selección única)
- **País de Origen**: Lista completa de países del mundo (195+ países)
  - Selección mediante dropdown profesional
  - Lista completa de todos los países reconocidos internacionalmente

- **Dificultad**: 
  - Todas las dificultades
  - Fácil
  - Media
  - Difícil

- **Turno de Comida**:
  - Todos los turnos
  - Desayuno
  - Aperitivo
  - Comida
  - Merienda
  - Cena

#### Filtros Numéricos
- **Duración Máxima**: Filtra recetas con duración menor o igual al valor especificado (en minutos)

### 3. Funcionalidades

#### Aplicar Filtros
- **Botón**: "Aplicar Filtros" (azul con icono de check)
- **Comportamiento**: 
  - Filtra las recetas según los criterios seleccionados
  - Muestra los resultados filtrados
  - Cierra automáticamente el modal
  - Muestra un badge informativo con los filtros activos

#### Limpiar Filtros
- **Botón**: "Limpiar Filtros" (gris con icono de X)
- **Comportamiento**:
  - Resetea todos los campos del formulario
  - Muestra todas las recetas nuevamente
  - Oculta los badges de filtros activos

#### Cancelar
- **Botón**: "Cancelar" (gris)
- **Comportamiento**: Cierra el modal sin aplicar cambios

### 4. Indicadores Visuales

#### Badges de Filtros Activos
Cuando se aplican filtros, se muestra un área informativa en el modal con badges de colores que indican:
- **Verde**: Filtro de ingredientes
- **Rojo**: Filtro de país
- **Amarillo**: Filtro de dificultad
- **Azul**: Filtro de turno de comida
- **Gris**: Filtro de duración máxima

#### Mensaje de "Sin Resultados"
Si no hay recetas que coincidan con los filtros, se muestra:
- Icono de búsqueda
- Mensaje: "No se encontraron recetas"
- Sugerencia: "Intenta ajustar los filtros para ver más resultados"

## Lógica de Filtrado

### Filtros de Texto
- **Case-insensitive**: No distingue entre mayúsculas y minúsculas
- **Búsqueda parcial**: Encuentra coincidencias en cualquier parte del texto
- **Ejemplo**: Buscar "poll" encontrará "pollo", "pollito", etc.

### Filtros de Valor Exacto
- **País, Dificultad y Turno de Comida**: Requieren coincidencia exacta con el valor seleccionado
- Si el campo está vacío en la receta, no coincidirá con ningún filtro

### Filtro Numérico (Duración)
- **Mayor o igual**: Muestra recetas con duración menor o igual al valor especificado
- **Validación**: Solo acepta números positivos

## Ejemplos de Uso

### Ejemplo 1: Buscar recetas rápidas de pasta
1. Abrir el modal de filtros
2. En "Ingredientes" escribir: `pasta`
3. En "Duración Máxima" poner: `30`
4. Hacer clic en "Aplicar Filtros"

### Ejemplo 2: Encontrar recetas fáciles españolas
1. Abrir el modal de filtros
2. En "País de Origen" seleccionar: `España`
3. En "Dificultad" seleccionar: `Fácil`
4. Hacer clic en "Aplicar Filtros"

### Ejemplo 3: Buscar desayunos rápidos
1. Abrir el modal de filtros
2. En "Turno de Comida" seleccionar: `desayuno`
3. En "Duración Máxima" poner: `15`
4. Hacer clic en "Aplicar Filtros"

## Notas Técnicas

### Variables Globales
- `todasLasRecetas`: Array que almacena todas las recetas sin filtrar

### Funciones Principales
- `filtrarRecetas(recetas, filtros)`: Aplica los filtros a las recetas
- `mostrarRecetasFiltradas(recetasFiltradas)`: Renderiza las recetas filtradas
- `obtenerFiltrosDelFormulario()`: Obtiene los valores del formulario
- `mostrarFiltrosActivos(filtros)`: Muestra los badges de filtros activos
- `limpiarFiltros()`: Resetea el formulario y muestra todas las recetas

### Persistencia
- Los filtros NO se persisten entre recargas de página
- Cada vez que se carga la página, se muestran todas las recetas
- Para mantener filtros activos, se puede modificar `cargarMisRecetas()` para leer desde localStorage

## Mejoras Futuras Posibles

1. **Persistencia de Filtros**: Guardar filtros en localStorage
2. **Filtros Múltiples**: Permitir seleccionar múltiples dificultades o turnos
3. **Ordenamiento**: Añadir opciones de ordenamiento (por fecha, nombre, duración)
4. **Filtro de Fecha**: Filtrar por fecha de creación
5. **Búsqueda Avanzada**: Búsqueda por múltiples ingredientes con operadores AND/OR
6. **Filtros Guardados**: Permitir guardar combinaciones de filtros favoritas
7. **Exportar Resultados**: Exportar recetas filtradas a PDF o CSV

## Compatibilidad

- ✅ Bootstrap 5.3.2
- ✅ Bootstrap Icons 1.11.0
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Responsive (funciona en móviles, tablets y desktop)

## Archivos Modificados

- `static/misrecetas.html`: Implementación completa del sistema de filtrado
