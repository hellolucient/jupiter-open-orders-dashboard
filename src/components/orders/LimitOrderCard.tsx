// Format date to be more readable
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZoneName: 'short'  // This will add "UTC" to the display
  })
} 