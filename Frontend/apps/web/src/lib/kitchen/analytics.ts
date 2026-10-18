import type { ActivityLog, MenuItem } from "./types";
export function summarizeActivity(logs:ActivityLog[]){
  const total=logs.reduce((sum,row)=>({prepared:sum.prepared+row.prepared,served:sum.served+row.served,leftover:sum.leftover+row.leftover}),{prepared:0,served:0,leftover:0});
  return {...total,rate:total.prepared?(100*total.leftover/total.prepared).toFixed(1):"0.0"};
}
export function buildActivityCsv(logs:ActivityLog[],menu:MenuItem[]){
  const cell=(value:unknown)=>{
    const text=String(value??"");
    const safe=/^\s*[=+\-@]/.test(text)||/^[\t\r\n]/.test(text)?"'"+text:text;
    return '"'+safe.replaceAll('"','""')+'"';
  };
  const rows=[["Date","Service","Dish","Prepared portions","Served portions","Leftover portions","Attendance","Notes"],...logs.map(row=>[row.service_date,row.meal_service,menu.find(item=>item.id===row.menu_item_id)?.name||"Saved menu item",row.prepared,row.served,row.leftover,row.attendance,row.notes])];
  return "\uFEFF"+rows.map(row=>row.map(cell).join(",")).join("\r\n");
}
