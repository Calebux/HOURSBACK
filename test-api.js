import { fetchPlaybooks } from './src/lib/api.js';
(async () => {
   const playbooks = await fetchPlaybooks();
   const agents = playbooks.filter(p => !!p.agentAutomation);
   console.log("Total playbooks:", playbooks.length);
   console.log("Total agents:", agents.length);
})();
