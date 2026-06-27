export interface TrendingTopic {
  rank: number
  title: string
  platform: string
  hot: string
}

export async function getTrendingTopics(platforms: string[]): Promise<TrendingTopic[]> {
  const weiboTopics: TrendingTopic[] = [
    { rank: 1, title: 'AI技术改变生活方式', platform: 'weibo', hot: '1.2亿' },
    { rank: 2, title: '夏季护肤必备清单', platform: 'weibo', hot: '8900万' },
    { rank: 3, title: '年轻人的消费趋势', platform: 'weibo', hot: '7600万' },
    { rank: 4, title: '独立开发者创业故事', platform: 'weibo', hot: '6200万' },
    { rank: 5, title: '职场晋升的秘密', platform: 'weibo', hot: '5800万' },
  ]
  const douyinTopics: TrendingTopic[] = [
    { rank: 1, title: '程序员下班后做什么', platform: 'douyin', hot: '2.3亿' },
    { rank: 2, title: '副业赚钱真实案例', platform: 'douyin', hot: '1.8亿' },
    { rank: 3, title: '产品发布会名场面', platform: 'douyin', hot: '1.5亿' },
    { rank: 4, title: '用AI做了什么神奇的事', platform: 'douyin', hot: '1.2亿' },
    { rank: 5, title: '夏天必喝的饮品合集', platform: 'douyin', hot: '9800万' },
  ]
  const result: TrendingTopic[] = []
  if (platforms.includes('weibo')) result.push(...weiboTopics)
  if (platforms.includes('douyin')) result.push(...douyinTopics)
  if (result.length === 0) result.push(...weiboTopics, ...douyinTopics)
  return result
}
