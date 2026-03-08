const handleSend = async () => {
  if (!input.trim()) return;
  
  // 1. Agregas mensaje del usuario a la lista local
  // 2. Llamas a TU API (no a la de Google)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: input, gender: user.gender })
  });
  const data = await res.json();
  // 3. Agregas data.reply a la lista
};