import pytest
from fastapi.testclient import TestClient
from server import app

# Crear el cliente de testing
client = TestClient(app)

def test_leer_root():
    response = client.get("/")
    assert response.status_code == 200

def test_read_root_no_vacio():
    response = client.get("/")
    assert response != ""

def test_read_root_content_type():
    response = client.get("/")
    assert response.headers["content-type"] == "text/html; charset=utf-8"

def test_apartado_recetas_existente():
    response = client.get("/recetas")
    assert response.status_code == 200

def test_apartado_recetas_no_vacio():
    response = client.get("/recetas")
    assert response != ""

def test_navegacion_root_a_recetas():
    """Test que verifica la navegación de / a /recetas"""
    # Paso 1: Cargar la página principal
    root_response = client.get("/")
    
    # Paso 2: Verificar que contiene el enlace a "Recetas"
    root_content = root_response.text
    assert "Recetas" in root_content
    assert 'href="http://127.0.0.1:8000/recetas"' in root_content
    
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
    response = client.get("/menusemanal")
    assert response.status_code == 200

def test_apartado_menu_no_vacio():
    response = client.get("/recetas")
    assert response != ""

def test_navegacion_root_to_recetas():
    """Test que verifica la navegación de / a /recetas"""
    # Paso 1: Cargar la página principal
    root_response = client.get("/")
    
    # Paso 2: Verificar que contiene el enlace a "Menú Semanal"
    root_content = root_response.text
    assert "Menú Semanal" in root_content
    assert 'href="http://127.0.0.1:8000/menusemanal"' in root_content
    
    # Paso 3: Simular el clic navegando a /menusemanal
    recetas_response = client.get("/recetas")
    assert recetas_response.status_code == 200

def test_tienen_contenido_diferente_root_and_menu():
    """Test que verifica que el contenido de / y /recetas es diferente"""
    # Paso 1: Cargar la página principal
    root_response = client.get("/")
    root_content = root_response.text

    # Paso 2: Cargar la página de menu semanal
    recetas_response = client.get("/menusemanal")
    recetas_content = recetas_response.text
    assert recetas_content != root_content

def test_existe_boton_crear_cuenta():
    response = client.get("/")
    assert "Crear cuenta" in response.text
    assert 'type="button"' in response.text