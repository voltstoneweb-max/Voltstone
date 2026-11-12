/**
 * Preguntas frecuentes del Centro de ayuda. Fuente: políticas de VOLTSTONE_01_Empresa_v3.md.
 * Si una política cambia, hay que cambiarla aquí y en server/src/data/brand.js (lo que sabe VoltBot).
 */
export const FAQ = [
  {
    group: 'Envíos',
    items: [
      ['¿Cuánto cuesta el envío?', 'En Colombia el envío tiene un valor fijo de $10.000. Por ahora solo enviamos dentro de Colombia.'],
      ['¿Cuánto tarda en llegar mi pedido?', 'Cali y alrededores: 1 día hábil. Ciudades principales: 2 a 4 días hábiles. Ciudades intermedias: 3 a 5. Zonas remotas: 5 a 8. Los fines de semana y los festivos no cuentan como días hábiles.'],
      ['¿Cuándo sale mi pedido?', 'Si pagas antes de las 14:00 de un día hábil, sale ese mismo día. Si pagas después, sale el siguiente día hábil.']
    ]
  },
  {
    group: 'Devoluciones y cambios',
    items: [
      ['¿Puedo devolver una prenda?', 'Sí. Tienes 5 días hábiles desde la entrega (derecho de retracto). La prenda debe estar sin uso, sin lavar, con etiquetas y en su empaque. El envío de la devolución lo pagas tú, salvo que haya un defecto o un error de VOLTSTONE.'],
      ['¿Cuándo recibo mi reembolso?', 'Por el mismo medio de pago, en máximo 30 días calendario.'],
      ['¿Puedo cambiar de talla?', 'Sí, un cambio gratis por pedido, sujeto a disponibilidad. VOLTSTONE paga el envío de la talla nueva.']
    ]
  },
  {
    group: 'Garantía y pedidos',
    items: [
      ['¿Qué cubre la garantía?', 'Tienes 30 días desde la entrega para reclamar por defectos de fabricación.'],
      ['¿Puedo cancelar un pedido?', 'Solo antes del despacho. Después del despacho aplica la devolución o el cambio.']
    ]
  },
  {
    group: 'Precios y reclamos',
    items: [
      ['¿Los precios incluyen IVA?', 'Sí. Los precios se muestran en pesos colombianos enteros, con el IVA del 19% incluido.'],
      ['¿Cómo presento una petición, queja o reclamo?', 'Usa el formulario de contacto y elige "Petición, queja o reclamo". Recibirás un número de radicado y una respuesta en máximo 15 días hábiles.']
    ]
  }
];
