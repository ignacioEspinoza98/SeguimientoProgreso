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


    if(Correo == UsuarioLocalStorage.correo && Contraseña == UsuarioLocalStorage.contraseña ){
      // Guardamos en sessionStorage que el usuario está logueado
      sessionStorage.setItem("Logueado", "true");

      window.location.href = "dashboard.html";
    }
  
    // Aquí puedes hacer algo con los datos, como enviarlos a un servidor
    console.log('Contraseña:', Contraseña);
    console.log('Correo:', Correo);
  });
  