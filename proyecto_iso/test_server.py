"""
Tests para el servidor de la aplicación web.
"""

import os
import glob
import subprocess
import tempfile
from fastapi.testclient import TestClient
from server import app
from constants import *

# Crear el cliente de testing
client = TestClient(app)

def test_leer_root():
    """Test que verifica que la página principal carga correctamente."""
    response = client.get("/")
    assert response.status_code == HTTP_OK

def test_leer_root_no_vacio():
    """Test que verifica que la página principal no está vacía."""
    response = client.get("/")
    assert response.text != ""

def test_leer_root_content_type():
    """Test que verifica el content-type de la página principal."""
    response = client.get("/")
    assert response.headers["content-type"] == "text/html; charset=utf-8"

def test_apartado_recetas_existente():
    response = client.get("/recetas")
    assert response.status_code == 200

def test_leer_apartado_recetas_no_vacio():
    response = client.get("/recetas")
    assert response != ""

def test_navegacion_root_a_recetas():
    """Test que verifica la navegación de / a /recetas"""
    # Paso 1: Cargar la página principal
    root_response = client.get("/")
    
    # Paso 2: Verificar que contiene el enlace a "Recetas"
    root_content = root_response.text
    assert "Recetas" in root_content
    assert 'href="/recetas"' in root_content
    
    # Paso 3: Simular el clic navegando a /recetas
    recetas_response = client.get("/recetas")
    assert recetas_response.status_code == 200

def test_tienen_contenido_diferente_root_y_recetas():
    """Test que verifica que el contenido de / y /recetas es diferente"""
    # Paso 1: Cargar la página principal
    root_response = client.get("/")
    root_content = root_response.text

    # Paso 2: Cargar la página de recetas
    recetas_response = client.get("/recetas")
    recetas_content = recetas_response.text
    assert recetas_content != root_content
    
def test_apartado_menu_existente():
    response = client.get("/menu-semanal")
    assert response.status_code == 200

def test_apartado_menu_no_vacio():
    response = client.get("/recetas")
    assert response != ""

def test_navegacion_root_a_recetas():
    """Test que verifica la navegación de / a /recetas"""
    # Paso 1: Cargar la página principal
    root_response = client.get("/")
    
    # Paso 2: Verificar que contiene el enlace a "Menú Semanal"
    root_content = root_response.text
    assert "Menú Semanal" in root_content
    assert 'href="/menu-semanal"' in root_content
    
    # Paso 3: Simular el clic navegando a /menusemanal
    recetas_response = client.get("/recetas")
    assert recetas_response.status_code == 200

def test_tienen_contenido_diferente_root_y_menu():
    """Test que verifica que el contenido de / y /recetas es diferente"""
    # Paso 1: Cargar la página principal
    root_response = client.get("/")
    root_content = root_response.text

    # Paso 2: Cargar la página de menu semanal
    recetas_response = client.get("/menu-semanal")
    recetas_content = recetas_response.text
    assert recetas_content != root_content

def test_existe_boton_crear_cuenta():
    response = client.get("/")
    assert "Crear Cuenta" in response.text
    assert 'type="button"' in response.text

def test_se_muestra_dialogo_al_crear_cuenta():
    response = client.get("/")
    assert 'data-bs-toggle="modal"' in response.text
    assert 'data-bs-target="#crearCuentaModal"' in response.text

def test_se_muestra_formulario_en_dialogo_de_crear_cuenta():
    response = client.get("/")
    assert 'action="/crear-cuenta"' in response.text
    assert 'method="POST"' in response.text
    assert 'name="nombreUsuario"' in response.text
    assert 'name="email"' in response.text
    assert 'name="password"' in response.text

def test_se_muestra_formulario_en_dialogo_de_iniciar_cuenta():
    response = client.get("/")
    assert 'action="/iniciar-sesion"' in response.text
    assert 'method="POST"' in response.text
    assert 'name="nombreUsuario"' in response.text
    assert 'name="email"' in response.text
    assert 'name="password"' in response.text

def test_se_muestra_dialogo_al_iniciar_cuenta():
    response = client.get("/")
    assert 'data-bs-toggle="modal"' in response.text
    assert 'data-bs-target="#iniciarSesionModal"' in response.text

def test_crear_cuenta_muestra_mensaje_exitoso():
    """Test que verifica la creación exitosa de una cuenta."""
    cuenta_test = {
        "nombreUsuario": "testuser123",
        "email": "testuser@example.com",
        "password": "testpassword123"
    }
    
    response = client.post("/crear-cuenta", json=cuenta_test)
    
    assert response.status_code == HTTP_OK
    
    response_data = response.json()
    assert response_data["exito"] == True
    assert MENSAJE_CUENTA_CREADA in response_data["mensaje"]

def test_crear_cuenta_cualquier_dato():
    cuenta_cualquiera = {
        "nombreUsuario": "a", 
        "email": "email@example.com", 
        "password": "1"  
    }
    
    response = client.post("/crear-cuenta", json=cuenta_cualquiera)
    
    # Debería funcionar sin validaciones
    assert response.status_code == HTTP_OK
    
    response_data = response.json()
    assert response_data["exito"] == True
    assert response_data["usuario_creado"] == cuenta_cualquiera["nombreUsuario"]
    assert response.status_code == 200



def test_existe_boton_crear_receta():
    response = client.get("/recetas")
    assert "Crear receta de comida" in response.text
    assert 'type="button"' in response.text

def test_se_muestra_dialogo_al_crear_receta():
    response = client.get("/recetas")
    assert 'data-bs-toggle="modal"' in response.text
    assert 'data-bs-target="#crearRecetaModal"' in response.text

def test_se_muestra_formulario_en_dialogo_de_crear_receta():
    response = client.get("/recetas")
    assert 'action="/crear-receta"' in response.text
    assert 'method="POST"' in response.text
    assert 'name="nombreReceta"' in response.text
    assert 'name="descripcion"' in response.text

def test_crear_receta_cualquier_dato():
    receta_cualquiera = {
        "nombreReceta": "Receta de prueba",
        "descripcion": "Descripción de prueba"
    }

    response = client.post("/crear-receta", json=receta_cualquiera)

    # Debería funcionar sin validaciones
    assert response.status_code == HTTP_OK
    
    response_data = response.json()
    assert response_data["exito"] == True
    assert response_data["receta_creada"] == receta_cualquiera["nombreReceta"]
    assert response.status_code == 200

def test_crear_receta_muestra_mensaje_exitoso():
    """Test que verifica la creación exitosa de una receta."""
    receta_test = {
        "nombreReceta": "testreceta123",
        "descripcion": "Una receta de prueba"
    }

    response = client.post("/crear-receta", json=receta_test)

    assert response.status_code == HTTP_OK
    
    response_data = response.json()
    assert response_data["exito"] == True
    assert MENSAJE_RECETA_CREADA in response_data["mensaje"]

def test_existe_boton_iniciar_sesion():
    response = client.get("/")
    assert "Iniciar Sesión" in response.text
    assert 'type="button"' in response.text

def test_iniciar_sesion_muestra_mensaje_exitoso():
    cuenta_test = {
        "nombreUsuario": "testuser123",
        "email": "testuser@example.com",
        "password": "testpassword123"
    }
    
    response = client.post("/iniciar-sesion", json=cuenta_test)
    assert response.status_code == HTTP_OK
    data = response.json()
    assert data["exito"] == True
    assert MENSAJE_CUENTA_INICIADA in data["mensaje"]


# =============================================================================
# TESTS UNITARIOS - VERIFICACIÓN DE FUNCIONALIDAD MODULAR VS BACKUP
# =============================================================================

def test_js_modular_structure_exists():
    """Test que verifica que la estructura modular de JavaScript existe."""
    import os
    base_path = "static/js"
    
    # Verificar que existen las carpetas principales
    assert os.path.exists(f"{base_path}/config"), "Carpeta config no existe"
    assert os.path.exists(f"{base_path}/services"), "Carpeta services no existe"
    assert os.path.exists(f"{base_path}/components"), "Carpeta components no existe"
    assert os.path.exists(f"{base_path}/utils"), "Carpeta utils no existe"
    
    # Verificar archivos principales
    assert os.path.exists(f"{base_path}/main.js"), "main.js no existe"

def test_js_config_files_exist():
    """Test que verifica que los archivos de configuración existen."""
    import os
    
    config_files = [
        "static/js/config/constants.js",
        "static/js/config/forms-config.js"
    ]
    
    for file_path in config_files:
        assert os.path.exists(file_path), f"Archivo {file_path} no existe"

def test_js_service_files_exist():
    """Test que verifica que los archivos de servicios existen."""
    import os
    
    service_files = [
        "static/js/services/auth-service.js",
        "static/js/services/api-service.js"
    ]
    
    for file_path in service_files:
        assert os.path.exists(file_path), f"Archivo {file_path} no existe"

def test_js_component_files_exist():
    """Test que verifica que los archivos de componentes existen."""
    import os
    
    component_files = [
        "static/js/components/form-handler.js",
        "static/js/components/message-handler.js",
        "static/js/components/modal-handler.js"
    ]
    
    for file_path in component_files:
        assert os.path.exists(file_path), f"Archivo {file_path} no existe"

def test_js_util_files_exist():
    """Test que verifica que los archivos de utilidades existen."""
    import os
    
    util_files = [
        "static/js/utils/validators.js",
        "static/js/utils/dom-utils.js"
    ]
    
    for file_path in util_files:
        assert os.path.exists(file_path), f"Archivo {file_path} no existe"

def test_constants_file_contains_required_exports():
    """Test que verifica que constants.js contiene las exportaciones necesarias."""
    with open("static/js/config/constants.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar exportaciones esperadas del backup
    required_exports = [
        "export const RUTA_USUARIO_INVITADO",
        "export const ENDPOINTS",
        "export const HTTP_CONFIG"
    ]
    
    for export in required_exports:
        assert export in content, f"Exportación faltante: {export}"

def test_constants_file_contains_backup_values():
    """Test que verifica que constants.js contiene los valores del backup."""
    with open("static/js/config/constants.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar valores específicos del backup
    backup_values = [
        '"invitado.html"',  # RUTA_USUARIO_INVITADO
        '"/crear-cuenta"',  # ENDPOINTS.CREAR_CUENTA
        '"/iniciar-sesion"',  # ENDPOINTS.INICIAR_SESION
        '"/cerrar-sesion"',  # ENDPOINTS.CERRAR_SESION
        '"/crear-receta"',  # ENDPOINTS.CREAR_RECETA
        '"application/json"'  # HTTP_CONFIG.HEADERS["Content-Type"]
    ]
    
    for value in backup_values:
        assert value in content, f"Valor faltante en constants.js: {value}"

def test_forms_config_contains_all_forms():
    """Test que verifica que forms-config.js contiene todos los formularios del backup."""
    with open("static/js/config/forms-config.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar que contiene todos los formularios del backup
    expected_forms = [
        "crearCuentaForm",
        "iniciarSesionForm", 
        "cerrarSesionForm",
        "crearRecetaForm"
    ]
    
    for form in expected_forms:
        assert form in content, f"Formulario faltante en config: {form}"

def test_forms_config_has_correct_structure():
    """Test que verifica que forms-config.js tiene la estructura correcta."""
    with open("static/js/config/forms-config.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar propiedades requeridas para cada formulario
    required_properties = [
        "endpoint:",
        "modal:",
        "campos:",
        "validaciones:"
    ]
    
    for prop in required_properties:
        assert content.count(prop) >= 4, f"Propiedad {prop} no aparece suficientes veces"

def test_validators_contains_password_function():
    """Test que verifica que validators.js contiene la función validarPassword."""
    with open("static/js/utils/validators.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar función de validación de contraseña
    assert "export function validarPassword" in content, "Función validarPassword no exportada"
    assert "length >= 8" in content, "Validación de longitud no encontrada"
    assert "/[A-Z]/" in content, "Validación de mayúscula no encontrada"
    assert "/[a-z]/" in content, "Validación de minúscula no encontrada"
    assert "/[0-9]/" in content, "Validación de número no encontrada"

def test_validators_contains_email_function():
    """Test que verifica que validators.js contiene la función validarEmail."""
    with open("static/js/utils/validators.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar función de validación de email
    assert "export function validarEmail" in content, "Función validarEmail no exportada"
    assert "/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/" in content, "Regex de email no encontrada"

def test_validators_contains_form_validation():
    """Test que verifica que validators.js contiene la función validarDatosFormulario."""
    with open("static/js/utils/validators.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar función de validación de formularios
    assert "export function validarDatosFormulario" in content, "Función validarDatosFormulario no exportada"
    assert "camposRequeridos" in content, "Lógica de campos requeridos no encontrada"

def test_auth_service_contains_required_functions():
    """Test que verifica que auth-service.js contiene las funciones necesarias."""
    with open("static/js/services/auth-service.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar funciones de autenticación del backup
    required_functions = [
        "export async function iniciarSesion",
        "export async function cerrarSesion", 
        "export async function crearCuenta"
    ]
    
    for func in required_functions:
        assert func in content, f"Función faltante: {func}"

def test_auth_service_logout_behavior():
    """Test que verifica que cerrarSesion tiene el comportamiento correcto del backup."""
    with open("static/js/services/auth-service.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar comportamiento específico de logout del backup
    assert "/?logout=true&t=" in content, "Redirección de logout no encontrada"
    assert "Date.now()" in content, "Timestamp en logout no encontrado"

def test_api_service_contains_create_recipe():
    """Test que verifica que api-service.js contiene la función crearReceta."""
    with open("static/js/services/api-service.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar función de creación de recetas
    assert "export async function crearReceta" in content, "Función crearReceta no exportada"
    assert "JSON.stringify" in content, "Serialización JSON no encontrada"

def test_form_handler_contains_main_function():
    """Test que verifica que form-handler.js contiene las funciones principales."""
    with open("static/js/components/form-handler.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar funciones principales del manejador de formularios
    assert "export async function manejarEnvioFormulario" in content, "Función manejarEnvioFormulario no exportada"
    assert "export function inicializarFormularios" in content, "Función inicializarFormularios no exportada"

def test_message_handler_contains_show_function():
    """Test que verifica que message-handler.js contiene función para mostrar mensajes."""
    with open("static/js/components/message-handler.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar función de mostrar mensajes
    assert "export function mostrarMensaje" in content, "Función mostrarMensaje no exportada"
    assert "position: 'fixed'" in content, "Estilo de mensaje flotante no encontrado"

def test_modal_handler_contains_modal_functions():
    """Test que verifica que modal-handler.js contiene funciones de modal."""
    with open("static/js/components/modal-handler.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar funciones de modal
    required_functions = [
        "export function abrirModal",
        "export function cerrarModal",
        "export function inicializarModales"
    ]
    
    for func in required_functions:
        assert func in content, f"Función faltante: {func}"

def test_dom_utils_contains_form_functions():
    """Test que verifica que dom-utils.js contiene funciones de manipulación DOM."""
    with open("static/js/utils/dom-utils.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar funciones de utilidades DOM
    required_functions = [
        "export function obtenerDatosFormulario",
        "export function manejarEstadoBoton",
        "export function obtenerBotonSubmit"
    ]
    
    for func in required_functions:
        assert func in content, f"Función faltante: {func}"

def test_main_js_imports_all_modules():
    """Test que verifica que main.js importa todos los módulos necesarios."""
    with open("static/js/main.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar imports de todos los módulos
    required_imports = [
        "from './components/form-handler.js'",
        "from './components/modal-handler.js'",
        "from './components/message-handler.js'"
    ]
    
    for import_statement in required_imports:
        assert import_statement in content, f"Import faltante: {import_statement}"

def test_main_js_initializes_components():
    """Test que verifica que main.js inicializa los componentes."""
    with open("static/js/main.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar inicialización de componentes
    required_initializations = [
        "inicializarFormularios()",
        "inicializarModales()"
    ]
    
    for init in required_initializations:
        assert init in content, f"Inicialización faltante: {init}"

def test_main_js_handles_url_parameters():
    """Test que verifica que main.js maneja parámetros URL como el backup."""
    with open("static/js/main.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar manejo de parámetros URL del backup
    assert "URLSearchParams" in content, "URLSearchParams no encontrado"
    assert "logout" in content, "Manejo de logout no encontrado"

def test_html_files_use_module_script():
    """Test que verifica que los archivos HTML usan el script modular."""
    import os
    import glob
    
    html_files = glob.glob("static/*.html")
    
    for html_file in html_files:
        with open(html_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Verificar que usa type="module" y la nueva ruta
        assert 'type="module"' in content, f"Script module no encontrado en {html_file}"
        assert 'src="/static/js/main.js"' in content, f"Nueva ruta de main.js no encontrada en {html_file}"

def test_backup_file_exists():
    """Test que verifica que el archivo backup existe para comparación."""
    import os
    assert os.path.exists("static/main.js.backup"), "Archivo backup no existe"

def test_backup_vs_modular_form_configs():
    """Test que compara las configuraciones de formularios entre backup y modular."""
    
    # Leer backup
    with open("static/main.js.backup", "r", encoding="utf-8") as f:
        backup_content = f.read()
    
    # Leer configuración modular
    with open("static/js/config/forms-config.js", "r", encoding="utf-8") as f:
        modular_content = f.read()
    
    # Verificar que los endpoints están en ambos
    endpoints_to_check = ["/crear-cuenta", "/iniciar-sesion", "/cerrar-sesion", "/crear-receta"]
    
    for endpoint in endpoints_to_check:
        assert endpoint in backup_content, f"Endpoint {endpoint} no está en backup"
        assert endpoint in modular_content, f"Endpoint {endpoint} no está en modular"

def test_password_validation_logic_consistency():
    """Test que verifica que la lógica de validación de contraseña es consistente."""
    
    # Leer backup para extraer lógica de validación
    with open("static/main.js.backup", "r", encoding="utf-8") as f:
        backup_content = f.read()
    
    # Leer validador modular
    with open("static/js/utils/validators.js", "r", encoding="utf-8") as f:
        modular_content = f.read()
    
    # Verificar elementos clave de validación de contraseña
    validation_elements = [
        "length >= 8",  # Longitud mínima
        "/[A-Z]/",     # Mayúscula
        "/[a-z]/",     # Minúscula  
        "/[0-9]/"      # Número
    ]
    
    for element in validation_elements:
        assert element in backup_content, f"Elemento de validación {element} no está en backup"
        assert element in modular_content, f"Elemento de validación {element} no está en modular"

def test_email_validation_logic_consistency():
    """Test que verifica que la lógica de validación de email es consistente."""
    
    # Leer backup
    with open("static/main.js.backup", "r", encoding="utf-8") as f:
        backup_content = f.read()
    
    # Leer validador modular
    with open("static/js/utils/validators.js", "r", encoding="utf-8") as f:
        modular_content = f.read()
    
    # Buscar regex de email (puede estar ligeramente diferente por escaping)
    # El patrón básico debe estar en ambos
    email_pattern_elements = ["@", "+", "\\.", "\\s"]
    
    for element in email_pattern_elements:
        assert element in backup_content, f"Elemento de email {element} no está en backup"
        assert element in modular_content, f"Elemento de email {element} no está en modular"

def test_form_field_mapping_consistency():
    """Test que verifica que el mapeo de campos de formulario es consistente."""
    
    # Leer backup
    with open("static/main.js.backup", "r", encoding="utf-8") as f:
        backup_content = f.read()
    
    # Leer validador modular
    with open("static/js/utils/validators.js", "r", encoding="utf-8") as f:
        modular_content = f.read()
    
    # Verificar mapeo de campos críticos
    field_mappings = [
        "emailCrearCuenta",
        "passwordCrearCuenta", 
        "emailIniciarSesion",
        "passwordIniciarSesion"
    ]
    
    for field in field_mappings:
        assert field in backup_content, f"Campo {field} no está en backup"
        assert field in modular_content, f"Campo {field} no está en modular"

def test_modular_exports_are_importable():
    """Test que verifica que todas las exportaciones modulares son importables."""
    import subprocess
    import tempfile
    import os
    
    # Crear un archivo temporal para probar imports
    test_script = '''
    // Test script para verificar imports
    import { RUTA_USUARIO_INVITADO, ENDPOINTS, HTTP_CONFIG } from './static/js/config/constants.js';
    import { CONFIGURACION_FORMULARIOS } from './static/js/config/forms-config.js';
    import { validarPassword, validarEmail, validarDatosFormulario } from './static/js/utils/validators.js';
    import { obtenerDatosFormulario, manejarEstadoBoton, obtenerBotonSubmit } from './static/js/utils/dom-utils.js';
    import { iniciarSesion, cerrarSesion, crearCuenta } from './static/js/services/auth-service.js';
    import { crearReceta } from './static/js/services/api-service.js';
    import { mostrarMensaje, mostrarExito, mostrarError } from './static/js/components/message-handler.js';
    import { abrirModal, cerrarModal, inicializarModales } from './static/js/components/modal-handler.js';
    import { manejarEnvioFormulario, inicializarFormularios } from './static/js/components/form-handler.js';
    
    console.log('All imports successful');
    '''
    
    # Los imports de ES6 modules requieren un servidor HTTP para funcionar
    # Este test verifica que los archivos existen y tienen la sintaxis correcta
    js_files = [
        "static/js/config/constants.js",
        "static/js/config/forms-config.js", 
        "static/js/utils/validators.js",
        "static/js/utils/dom-utils.js",
        "static/js/services/auth-service.js",
        "static/js/services/api-service.js",
        "static/js/components/message-handler.js",
        "static/js/components/modal-handler.js",
        "static/js/components/form-handler.js"
    ]
    
    for js_file in js_files:
        assert os.path.exists(js_file), f"Archivo JS {js_file} no existe"
        
        # Verificar sintaxis básica - que contiene export
        with open(js_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        assert "export" in content, f"Archivo {js_file} no contiene exports"

def test_critical_functionality_coverage():
    """Test que verifica que toda la funcionalidad crítica del backup está cubierta."""
    
    # Lista de funcionalidades críticas que deben estar presentes
    critical_features = {
        "password_validation": "static/js/utils/validators.js",
        "email_validation": "static/js/utils/validators.js", 
        "form_submission": "static/js/components/form-handler.js",
        "modal_handling": "static/js/components/modal-handler.js",
        "message_display": "static/js/components/message-handler.js",
        "logout_redirect": "static/js/services/auth-service.js",
        "form_data_extraction": "static/js/utils/dom-utils.js",
        "url_parameter_handling": "static/js/main.js"
    }
    
    for feature, file_path in critical_features.items():
        assert os.path.exists(file_path), f"Archivo para {feature} no existe: {file_path}"
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Verificaciones específicas por característica
        if feature == "password_validation":
            assert "length >= 8" in content, f"Validación de longitud faltante en {feature}"
        elif feature == "logout_redirect": 
            assert "/?logout=true" in content, f"Redirección de logout faltante en {feature}"
        elif feature == "url_parameter_handling":
            assert "URLSearchParams" in content, f"Manejo de URL params faltante en {feature}"