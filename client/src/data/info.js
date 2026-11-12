/**
 * Textos de las páginas informativas y legales (/info/:slug).
 * Deben coincidir con las políticas de server/src/data/brand.js (lo que sabe VoltBot) y con client/src/data/faq.js.
 * Cada sección es [título, [párrafos]].
 */
const UPDATED = '10 de noviembre de 2026';
const CONTACT = 'voltstone.web@gmail.com';

export const INFO = {
  terminos: {
    title: 'Términos y condiciones',
    updated: UPDATED,
    sections: [
      ['Quiénes somos', ['VOLTSTONE CALI SAS es una tienda de ropa en línea para hombre y mujer con sede en el barrio San Fernando, en Cali, Colombia. Vendemos solo por internet. Es una empresa ficticia con fines académicos: los datos comerciales y legales son simulados.']],
      ['Uso del sitio', ['Puedes ver el catálogo y rastrear un pedido sin crear una cuenta. Para crear una cuenta debes ser mayor de edad y dar datos verdaderos. Eres responsable de guardar tu clave y de lo que se haga con tu cuenta.']],
      ['Precios y pagos', ['Los precios están en pesos colombianos, sin decimales, con el IVA incluido. Los medios de pago son tarjeta, PSE y contra entrega. La pasarela de pago de este sitio es una simulación: no te pedimos ni guardamos datos de tarjeta.']],
      ['Pedidos', ['Tu pedido queda confirmado cuando el pago se registra. Verás un recibo en pantalla (no enviamos PDF) y un número de pedido para rastrearlo. Los estados son: Pendiente, Pagado, En preparación, Empacado, Enviado, Entregado y Cancelado. Solo puedes cancelar antes del despacho.']],
      ['Envíos, cambios y garantía', ['Se rigen por la política de envíos y por la de cambios, garantías, retracto y reversión, publicadas en este sitio. Hacen parte de estos términos.']],
      ['Contenido del sitio', ['El nombre, el logotipo, las fotos, los textos y los diseños son de VOLTSTONE. No puedes copiarlos ni usarlos sin permiso escrito.']],
      ['Cambios a estos términos', ['Podemos actualizar estos términos. Vale la versión publicada en este sitio, con su fecha de actualización.']],
      ['Contacto', [`Escríbenos desde el formulario de contacto o a ${CONTACT}.`]]
    ]
  },
  privacidad: {
    title: 'Política de privacidad y tratamiento de datos personales',
    updated: UPDATED,
    sections: [
      ['Quién es el responsable', [`VOLTSTONE CALI SAS, barrio San Fernando, Cali. Contacto para este tema: ${CONTACT}.`]],
      ['Qué datos recogemos', ['Tu nombre, correo, teléfono, ciudad y dirección de entrega, los datos de tus pedidos, los mensajes que nos envías por el formulario y tu clave, que se guarda cifrada. No guardamos datos de tarjeta.']],
      ['Para qué los usamos', ['Para crear y administrar tu cuenta, procesar y entregar tus pedidos, avisarte del estado de tu compra, responder tus preguntas, peticiones, quejas y reclamos, y mejorar la tienda.']],
      ['Tu autorización', ['Al crear tu cuenta o iniciar sesión autorizas el tratamiento de tus datos para esas finalidades. Guardamos la fecha en que aceptaste. Puedes retirar tu autorización cuando quieras.']],
      ['Tus derechos', ['Puedes conocer qué datos tenemos de ti, actualizarlos o corregirlos, pedir que los borremos, retirar tu autorización y presentar un reclamo. Para hacerlo usa el formulario de contacto y elige "Petición, queja o reclamo". Respondemos en máximo 15 días hábiles.']],
      ['Con quién los compartimos', ['Solo con quienes los necesitan para atenderte: la transportadora (nombre, teléfono y dirección para entregar), la pasarela de pago y los proveedores de tecnología del sitio. No vendemos tus datos.']],
      ['Cuánto tiempo los guardamos', ['Mientras tengas tu cuenta y durante el tiempo que exijan las obligaciones contables y legales de la empresa.']],
      ['Seguridad', ['Las claves se guardan cifradas, la conexión es segura y el acceso interno está limitado por roles.']],
      ['Menores de edad', ['Este sitio no está pensado para menores de 18 años.']],
      ['Cambios', ['Si cambiamos esta política publicaremos la nueva versión aquí, con su fecha.']]
    ]
  },
  cookies: {
    title: 'Política de cookies',
    updated: UPDATED,
    sections: [
      ['Qué usamos', ['Hoy no usamos cookies de publicidad ni de seguimiento de terceros. Guardamos en tu navegador solo lo necesario para mantener tu sesión abierta mientras la pestaña esté abierta.']],
      ['Cómo controlarlo', ['Puedes borrar los datos del sitio desde la configuración de tu navegador. Si lo haces, tendrás que iniciar sesión de nuevo.']],
      ['Si esto cambia', ['Si algún día agregamos herramientas de medición, lo diremos aquí y te pediremos tu autorización antes de activarlas.']]
    ]
  },
  cambios: {
    title: 'Cambios, garantías, retracto y reversión',
    updated: UPDATED,
    sections: [
      ['Derecho de retracto', ['Tienes 5 días hábiles desde la entrega para devolver tu compra. La prenda debe estar sin uso, sin lavar, con etiquetas y en su empaque. El envío de la devolución lo pagas tú, salvo que haya un defecto o un error de VOLTSTONE.']],
      ['Reembolso', ['Te devolvemos el dinero por el mismo medio de pago en máximo 30 días calendario.']],
      ['Garantía', ['Tienes 30 días desde la entrega para reclamar por defectos de fabricación.']],
      ['Cambio de talla', ['Un cambio gratis por pedido, sujeto a disponibilidad. VOLTSTONE paga el envío de la talla nueva.']],
      ['Cancelaciones', ['Puedes cancelar un pedido solo antes del despacho. Después aplican el retracto, la garantía o el cambio.']],
      ['Reversión del pago', ['Si ves un cobro que no autorizaste o un cobro doble, escríbenos de inmediato para revisarlo y revertirlo.']],
      ['Cómo pedirlo', ['Usa el formulario de contacto y elige "Devoluciones y cambios" o "Garantía". Cada caso recibe un número de radicado.']]
    ]
  },
  envios: {
    title: 'Política de envíos',
    updated: UPDATED,
    sections: [
      ['Costo', ['En Colombia el envío tiene un valor fijo de $10.000. El envío internacional se cotiza y lo ves antes de pagar.']],
      ['Tiempos de entrega', ['Cali y alrededores: 1 día hábil. Ciudades principales: 2 a 4 días hábiles. Ciudades intermedias: 3 a 5. Zonas remotas: 5 a 8. Internacional: 7 a 15 días. A los pueblos se les suma tiempo extra.']],
      ['Fecha estimada', ['La fecha estimada se calcula según la distancia y la ciudad de entrega. Si pagas antes de las 14:00 de un día hábil, tu pedido sale ese mismo día; si pagas después, sale el siguiente día hábil.']],
      ['Dirección', ['Revisa bien tu dirección. Si es incorrecta y hay que reenviar el pedido, se puede cobrar un recargo.']],
      ['Rastreo', ['Con tu número de pedido (por ejemplo VOLT-1001) puedes ver su estado en la página Rastrear pedido.']]
    ]
  },
  'como-comprar': {
    title: '¿Cómo comprar?',
    updated: null,
    sections: [
      ['1. Elige tu prenda', ['Explora el catálogo por género o categoría, o usa la lupa. Entra a la prenda para ver sus fotos, materiales, tallas y stock.']],
      ['2. Escoge tu talla', ['Selecciona la talla y la cantidad. Si dudas, mira la guía de tallas. Hasta que elijas una talla el botón no te deja agregar.']],
      ['3. Agrega a la bolsa', ['Tu bolsa aparece a la derecha. Ahí puedes cambiar cantidades, quitar prendas y ver el total con el envío fijo de $10.000. También puedes guardar prendas en favoritos con el corazón.']],
      ['4. Paga', ['Completa tus datos de entrega y elige tarjeta, PSE o contra entrega (el pago es una simulación). Puedes comprar con tu cuenta o como invitado.']],
      ['5. Guarda tu número de pedido', ['Al terminar verás tu recibo en pantalla con un número como VOLT-1004. Con él puedes ver el estado en Rastrear pedido.']]
    ]
  },
  tallas: {
    title: 'Guía de tallas',
    updated: null,
    intro: 'Medidas del cuerpo en centímetros, como referencia. Si estás entre dos tallas, elige la más grande.',
    table: {
      head: ['Talla', 'Pecho', 'Cintura', 'Cadera'],
      rows: [['XS', '82 - 86', '62 - 66', '88 - 92'], ['S', '86 - 90', '66 - 70', '92 - 96'], ['M', '90 - 96', '70 - 76', '96 - 102'], ['L', '96 - 102', '76 - 82', '102 - 108'], ['XL', '102 - 108', '82 - 88', '108 - 114']]
    },
    sections: [
      ['Cómo medirte', ['Pecho: alrededor de la parte más ancha, con la cinta paralela al piso. Cintura: alrededor de la parte más delgada del torso. Cadera: alrededor de la parte más ancha, por encima de los glúteos.']],
      ['Si no te queda', ['Tienes un cambio de talla gratis por pedido, sujeto a disponibilidad.']]
    ]
  },
  marca: {
    title: 'Nuestra marca',
    updated: null,
    sections: [
      ['Quiénes somos', ['VOLTSTONE es una tienda de ropa en línea de Colombia para hombre y mujer, pensada para el clima cálido. Diseñamos y fabricamos nuestra ropa en nuestra propia sede en Cali.']],
      ['Qué nos mueve', ['Tecnología que impulsa tu estilo: prendas cómodas, con telas pensadas para el calor y un diseño que se ve bien todos los días.']],
      ['Colección', ['Colección Urban, temporada 2026.']]
    ]
  },
  sede: {
    title: 'Nuestra sede',
    updated: null,
    sections: [
      ['Dónde estamos', ['Barrio San Fernando, Cali, Colombia. Desde ahí diseñamos, cortamos, cosemos, empacamos y despachamos.']],
      ['Tienda', ['No tenemos un local abierto al público: vendemos solo por internet y enviamos a todo el país.']],
      ['Escríbenos', [`Por el formulario de contacto, a ${CONTACT} o al +57 300 700 8080.`]]
    ]
  }
};
