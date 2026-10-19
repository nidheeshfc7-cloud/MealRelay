export function planningDate(offset=0){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const part=(type:string)=>Number(parts.find(item=>item.type===type)?.value);
  return new Date(Date.UTC(part("year"),part("month")-1,part("day")+offset)).toISOString().slice(0,10);
}
export function planningDateLabel(date:string){
  return new Intl.DateTimeFormat("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));
}
