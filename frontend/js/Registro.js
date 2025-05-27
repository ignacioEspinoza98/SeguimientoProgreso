document.getElementById('RegistroForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Previene el envío real del formulario
  
    const Contraseña = document.getElementById('Contraseña').value;
    const ConfirmarContraseña = document.getElementById('ConfirmarContraseña').value;
    const Correo = document.getElementById('Correo').value;
    const Usuario = document.getElementById('Usuario').value;
    const CorreoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const CorreoVerificado = CorreoRegex.test(Correo);
    const UsuarioRegex = /^[a-zA-Z0-9_]{4,20}$/;
    const UsuarioVerificado = UsuarioRegex.test(Usuario);
  
    // Validación sencilla
    if (Contraseña.trim() === '' || Correo.trim() === '' || ConfirmarContraseña=== '' || Usuario==='')  {
      alert("Campos Vacios");
      return;
    }

    if(!CorreoVerificado){
      alert("Correo Invalido");
      return
    }

    if(Contraseña !== ConfirmarContraseña){
      alert("Contraseñas Diferentes");
      return
    }

    if(!UsuarioVerificado){
      alert("Usuario Invalido 4 a 20 caracteres(A-Z) Numeros (0-9) Guiones Altos y Bajos");
      return
    }

let DatosUsuarios = JSON.parse(localStorage.getItem("Usuario")) || { usuarios: [] };


const UsuarioNuevo = {
  usuario: Usuario,
  contraseña: Contraseña,
  correo: Correo
};

const existeCorreo = DatosUsuarios.usuarios.some(
  usuario => usuario.correo === UsuarioNuevo.correo
);

if (existeCorreo) {
  alert("El correo ya está registrado. Intenta con otro.");
}

else
  {DatosUsuarios.usuarios.push(UsuarioNuevo);


  localStorage.setItem("Usuario", JSON.stringify(DatosUsuarios));
  
  document.getElementById('RegistroForm').reset();
  
  
      alert("Usuario Registrado");
    
      
      console.log('Contraseña:', Contraseña);
      console.log('Correo:', Correo);
      console.log('ConfirmarContraseña',ConfirmarContraseña)
      console.log('Usuario',Usuario)

      window.location.href = "inicioSesion.html";
    }
    
      
  
  });
  