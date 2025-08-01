export interface ConfiguracionUsuario {
  notificacionesEmail: boolean;
  notificacionesWeb: boolean;
  temaOscuro: boolean;
  mostrarAvatar: boolean;
  perfilPublico: boolean;
  configuracionPrivacidad: {
    mostrarEmail: boolean;
    mostrarTelefono: boolean;
    mostrarFechaNacimiento: boolean;
  };
}
