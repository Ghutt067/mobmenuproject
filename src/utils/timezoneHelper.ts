/**
 * Obtém o horário atual em um timezone específico
 */
export function getCurrentTimeInTimezone(timezone: string = 'America/Sao_Paulo'): {
  date: Date;
  timeString: string;
  dayOfWeek: string;
  dayOfWeekNumber: number;
} {
  const now = new Date();
  
  // Converter para o timezone especificado
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
  });

  const parts = formatter.formatToParts(now);
  
  const dayOfWeek = parts.find(p => p.type === 'weekday')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  
  // Criar uma string de data no timezone local para obter o objeto Date correto
  const timeString = `${hour}:${minute}`;
  
  // Obter o número do dia da semana (0 = domingo, 1 = segunda, etc.)
  const dayOfWeekNumber = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getDay();
  
  // Criar um objeto Date no timezone correto
  const dateInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  return {
    date: dateInTimezone,
    timeString,
    dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
    dayOfWeekNumber,
  };
}

/**
 * Converte o nome do dia da semana em inglês para o formato usado no sistema
 */
export function getDayNameFromNumber(dayNumber: number): 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' {
  const days: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  return days[dayNumber];
}

/**
 * Obtém o nome do dia em português
 */
export function getDayNameInPortuguese(day: string): string {
  const days: Record<string, string> = {
    'monday': 'Segunda-feira',
    'tuesday': 'Terça-feira',
    'wednesday': 'Quarta-feira',
    'thursday': 'Quinta-feira',
    'friday': 'Sexta-feira',
    'saturday': 'Sábado',
    'sunday': 'Domingo',
  };
  return days[day] || day;
}

/**
 * Verifica se a loja está aberta no momento
 */
export function isStoreOpen(
  operatingDays: Array<{ day: string; open: boolean; openTime?: string; closeTime?: string }> | undefined,
  currentDayNumber: number,
  currentTime: string,
  isClosed: boolean = false,
  appointmentOnlyMode: boolean = false
): boolean {
  if (isClosed || appointmentOnlyMode) {
    return false;
  }

  if (!operatingDays || operatingDays.length === 0) {
    return true; // Se não há configuração, assume que está aberto
  }

  const currentDayName = getDayNameFromNumber(currentDayNumber);
  const dayConfig = operatingDays.find(d => d.day === currentDayName);

  if (!dayConfig || !dayConfig.open) {
    return false;
  }

  if (!dayConfig.openTime || !dayConfig.closeTime) {
    return true; // Se não há horário específico, assume que está aberto
  }

  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const [openHour, openMinute] = dayConfig.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = dayConfig.closeTime.split(':').map(Number);

  const currentMinutes = currentHour * 60 + currentMinute;
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

