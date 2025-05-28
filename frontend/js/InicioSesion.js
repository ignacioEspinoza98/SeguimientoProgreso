document.getElementById('InicioSesionForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Previene el envío real del formulario
  
    const Contraseña = document.getElementById('Contraseña').value;
    const Correo = document.getElementById('Correo').value;
    const CorreoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const CorreoVerificado = CorreoRegex.test(Correo);
    const UsuarioLocalStorage = JSON.parse(localStorage.getItem("Usuario"));
  
    // Validación sencilla
    if (Contraseña.trim() === '' || Correo.trim() === '')  {
      alert("Campos Vacios");
      return;
    }

    if(!CorreoVerificado){
      alert("Correo Invalido");
      return; 
    }

    const BuscarCorreoUsuario = UsuarioLocalStorage.usuarios.find(
      usuario => usuario.correo === Correo && usuario.contraseña === Contraseña
    );

    if (BuscarCorreoUsuario) {
      sessionStorage.setItem("Logueado", "true");
      sessionStorage.setItem("usuario", JSON.stringify({ nombre: BuscarCorreoUsuario.usuario }));
      window.location.href = "Dashboard.html";
    }

    else{
      alert("Credenciales Invalidas")
    }
   
    console.log('Contraseña:', Contraseña);
    console.log('Correo:', Correo);
  });
  