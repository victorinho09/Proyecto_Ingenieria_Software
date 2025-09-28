"""
Tests para el servidor de la aplicación web.
"""

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

