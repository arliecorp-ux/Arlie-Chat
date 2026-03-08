const sendMessage = async (text: string) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: text, 
        gender: user.gender // Enviamos el género para personalizar la respuesta
      }),
    });
    const data = await response.json();
    // Aquí agregas la respuesta de data.reply a tu lista de mensajes
  } catch (error) {
    console.error("Error en el chat");
  }
};