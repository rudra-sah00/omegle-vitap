export function isServiceOnline(): boolean {
  const env = process.env.NODE_ENV || 'development';
  
  // In development, always return true for testing
  if (env === 'development') {
    return true;
  }

  const now = new Date();
  // Convert to IST (UTC+5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istTime = new Date(utc + istOffset);
  
  const hours = istTime.getHours();
  
  // Online between 9 PM (21:00) and 2 AM (02:00)
  return hours >= 21 || hours < 2;
}
