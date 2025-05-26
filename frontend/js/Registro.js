document.getElementById('RegistroForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Previene el envío real del formulario
  
    const Contraseña = document.getElementById('Contraseña').value;
    const ConfirmarContraseña = document.getElementById('ConfirmarContraseña').value;
    const Correo = document.getElementById('Correo').value;
    const Usuario = document.getElementById('Usuario').value;

  
    // Validación sencilla
    if (Contraseña.trim() === '' || Correo.trim() === '' || ConfirmarContraseña=== '' || Usuario==='')  {
      alert("camposVacios")
      return;
    }
  
    // Aquí puedes hacer algo con los datos, como enviarlos a un servidor
    console.log('Contraseña:', Contraseña);
    console.log('Correo:', Correo);
    console.log('ConfirmarContraseña',ConfirmarContraseña)
    console.log('Usuario',Usuario)
    
  });
  