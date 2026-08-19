/**
 * Smoke tests for agent intent routing (node: tsx / vitest-free).
 */
import {
  classifyAgentIntent,
  parseSlashCommand,
  followUpsForKind,
} from '../lib/workbench/agentIntent'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(parseSlashCommand('/angles foo').command === 'deliverable_angles', 'slash angles')
assert(parseSlashCommand('/apply').command === 'canvas_apply', 'slash apply')
assert(classifyAgentIntent('为 Electric Mint 写 3 个营销角度') === 'deliverable_angles', 'angles zh')
assert(classifyAgentIntent('知识源→知识卡→营销→四平台复用→排期') === 'plan', 'chain plan')
assert(classifyAgentIntent('应用到画布') === 'canvas_apply', 'apply')
assert(classifyAgentIntent('一键按依赖运行') === 'canvas_run', 'run')
assert(classifyAgentIntent('打开排期 · 待办') === 'canvas_schedule', 'schedule board')
assert(classifyAgentIntent('/schedule') === 'canvas_schedule', 'slash schedule')
assert(followUpsForKind('plan', true).some(s => /应用/.test(s)), 'plan followups')

console.log('agent-intent: ok')
