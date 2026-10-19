import {api} from './api.js';
export const dashboardService={getSnapshot:()=>api('planner'),toggleTask:id=>api(`planner/${id}`,'PATCH'),addTask:(title,priority='Media')=>api('planner','POST',{title,priority}),deleteTask:id=>api(`planner/${id}`,'DELETE')};
