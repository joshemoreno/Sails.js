const path = require('path')
const fs = require('fs');


/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  inicioSesion: async (peticion, respuesta) => {
    respuesta.view('pages/admin/inicio_sesion')
  },

  procesarInicioSesion: async (peticion, respuesta) => {
    let admin = await Admin.findOne({ email: peticion.body.email, contrasena: peticion.body.contrasena })
    if (admin && admin.activo != false) {
      peticion.session.admin = admin
      peticion.session.cliente = undefined
      peticion.addFlash('mensaje', 'Sesión de admin iniciada')
      return respuesta.redirect("/admin/principal")
    }
    else {
      peticion.addFlash('mensaje', 'Email o contraseña invalidos')
      return respuesta.redirect("/admin/inicio-sesion");
    }
  },

  principal: async (peticion, respuesta) => {
    if (!peticion.session || !peticion.session.admin) {
      peticion.addFlash('mensaje', 'Sesión inválida')
      return respuesta.redirect("/admin/inicio-sesion")
    }
    let fotos = await Foto.find().sort("id")
    respuesta.view('pages/admin/principal', { fotos })
  },

  cerrarSesion: async (peticion, respuesta) => {
    peticion.session.admin = undefined
    peticion.addFlash('mensaje', 'Sesión finalizada')
    return respuesta.redirect("/");
  },

  agregarFoto: async (peticion, respuesta) => {
    respuesta.view('pages/admin/agregar_foto')
  },

  procesarAgregarFoto: async (peticion, respuesta) => {
    let foto = await Foto.create({
      titulo: peticion.body.titulo,
      activa: true
    }).fetch()
    peticion.file('foto').upload({}, async (error, archivos) => {
      if (archivos && archivos[0]) {
        let upload_path = archivos[0].fd
        let ext = path.extname(upload_path)

        await fs.createReadStream(upload_path).pipe(fs.createWriteStream(path.resolve(sails.config.appPath, `assets/images/fotos/${foto.id}${ext}`)))
        await Foto.update({ id: foto.id }, { contenido: `${foto.id}${ext}` })
        peticion.addFlash('mensaje', 'Foto agregada')
        return respuesta.redirect("/admin/principal")
      }
      peticion.addFlash('mensaje', 'No hay foto seleccionada')
      return respuesta.redirect("/admin/agregar-foto")
    })
  },

  desactivarFoto: async (peticion, respuesta) => {
    await Foto.update({ id: peticion.params.fotoId }, { activa: false })
    peticion.addFlash('mensaje', 'Foto desactivada')
    return respuesta.redirect("/admin/principal")
  },

  activarFoto: async (peticion, respuesta) => {
    await Foto.update({ id: peticion.params.fotoId }, { activa: true })
    peticion.addFlash('mensaje', 'Foto activada')
    return respuesta.redirect("/admin/principal")
  },

  clientes: async (peticion, respuesta) => {
    let clientes = await Cliente.find().sort("id")
    respuesta.view('pages/admin/clientes', { clientes })
  },

  desactivarCliente: async (peticion, respuesta) => {
    await Cliente.update({ id: peticion.params.clienteId }, { activo: false })
    peticion.addFlash('mensaje', 'cliente desactivado')
    return respuesta.redirect("/admin/clientes")
  },

  activarCliente: async (peticion, respuesta) => {
    await Cliente.update({ id: peticion.params.clienteId }, { activo: true })
    peticion.addFlash('mensaje', 'Cliente activado')
    return respuesta.redirect("/admin/clientes")
  },

  administradores: async (peticion, respuesta) => {
    let administradores = await Admin.find().sort("id")
    respuesta.view('pages/admin/administradores', { administradores })
  },

  desactivarAdministrador: async (peticion, respuesta) => {
    await Admin.update({ id: peticion.params.administradorId }, { activo: false })
    peticion.addFlash('mensaje', 'Administrdor desactivado')
    return respuesta.redirect("/admin/administradores")
  },

  activarAdministrador: async (peticion, respuesta) => {
    await Admin.update({ id: peticion.params.AdministradorId }, { activo: true })
    peticion.addFlash('mensaje', 'Administrador activado')
    return respuesta.redirect("/admin/administradores")
  },

  ordenes: async (peticion, respuesta) => {
    let ordenes = await Orden.find({ cliente: peticion.params.clienteId }).sort('id desc')
    respuesta.view('pages/admin/ordenes', { ordenes })
  },

  orden: async (peticion, respuesta) => {
    let orden = await Orden.findOne({ id: peticion.params.ordenId }).populate('detalles')

    if (!orden) {
      return respuesta.redirect("/ordenes")
    }
    if (orden && orden.detalles == 0) {
      return respuesta.view('pages/admin/orden', { orden })
    }
    orden.detalles = await OrdenDetalle.find({ orden: orden.id }).populate('foto')
    respuesta.view('pages/admin/orden', { orden })
  },

  dashboard: async (peticion, respuesta) => {
    let clientes = await Cliente.count()
    let administradores = await Admin.count()
    let fotos = await Foto.count()
    let ordenes = await Orden.count()
    respuesta.view('pages/admin/dashboard', { clientes, administradores, fotos, ordenes })
  }


};

