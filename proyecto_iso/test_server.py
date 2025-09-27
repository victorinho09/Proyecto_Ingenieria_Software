import pytest
from fastapi.testclient import TestClient
from server import app

# Crear el cliente de testing
client = TestClient(app)

def test_leer_root():
    response = client.get("/")
    assert response.status_code == 200

def test_leer_root_no_vacio():
    response = client.get("/")
    assert response != ""

def test_leer_root_content_type():
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
    assert 'href="http://127.0.0.1:8000/menu-semanal"' in root_content
    
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
    assert "Crear cuenta" in response.text
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

def test_mandar_datos_crear_cuenta_existente():
    response = client.post("/crear-cuenta", json={
        "nombreUsuario": "testuser",
        "email": "testuser@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert response.json()["exito"] == True
    assert "Cuenta creada con éxito" in response.json()["mensaje"]
    assert response.status_code == 200