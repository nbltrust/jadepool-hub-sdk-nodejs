interface ApiConfig {
  /** Jadepool endpoint URL 瑶池URL */
  httpEndpoint: string;
  /** Jadepool appId ECC私钥对应的appId(admin上设置) */
  appId: string;
  /** Jadepool communication ECC private key 和瑶池通信ECC私钥 */
  eccKey: string;
  /** the encoder of Jadepool communication ECC private key */
  eccKeyEncoder: 'hex' | 'base64';
}

/** 提现参数 */
interface WithdrawParams {
  /** 必填，币种简称唯一代号 */
  coinId: string
  /** 必填，目标地址 */
  to: string
  /** 必填，提现金额 */
  value: string
  /** 选填（0.12.0以后为必填），提现唯一序列号 */
  sequence?: number
  /** 选填，交易备注（部分区块链可用） */
  memo?: string
  /** 选填，提现应用备注，将缓存与订单内给予返回 */
  extraData?: string
}

interface Fee {
  coinName: string
  nativeName: string
  amount: string
}

/** 订单详情 */
interface Order {
  id: string,
  state: string,
  bizType: string,
  type: string,
  subType: string,
  from: string,
  to: string,
  value: string,
  n: number,
  fee: string,
  fees: Fee[],
  hash: string,
  block: number,
  confirmations: number,
  create_at: number,
  update_at: number,
  data: object,
  extraData?: string
  sendAgain?: boolean
}

/** 审计详情 */
interface Audit {
  appid: string
  calculated: boolean
  blocknumber: number
  timestamp: number
  // 统计
  deposit_total: string
  withdraw_total: string
  sweep_total: string
  sweep_internal_total: string
  airdrop_total: string
  recharge_total: string
  recharge_internal_total: string
  recharge_unknown_total: string
  recharge_special_total: string
}

/** 余额详情 */
interface BalanceData {
  /** 总余额，在热钱包内的总额 */
  balance: string
  /** 可用余额，可被提现的余额 */
  balanceAvailable: string
  /** 不可用余额，因种种原因暂不可提现的余额 */
  balanceUnavailable: string
}

/**
 * Jadepool api instance
 */
declare class Api {
  constructor (cfg: ApiConfig);

  /**
   * 生成新充值地址
   * @param coinId 币种简称唯一代号
   * @throws 参数不匹配或请求失败
   */
  newAddress (coinId: string): Promise<string>;
  /**
   * 验证地址是否合法
   * @param coinId 币种简称唯一代号
   * @param address 地址
   * @throws 参数不匹配或请求失败
   */
  verifyAddress (coinId: string, address: string): Promise<boolean>;
  /**
   * 发起提现订单
   * @param params 提现请求参数
   * @throws 参数不匹配或请求失败
   */
  withdraw (params: WithdrawParams): Promise<Order>;
  /**
   * 查询订单
   * @param orderId 订单号
   * @throws 参数不匹配或请求失败
   */
  getOrder (orderId: string|number): Promise<Order>;
  /**
   * 发起一次对某个币种的升级
   * @param coinId 币种简称唯一代号
   * @param auditTime 审计的目标时间
   * @throws 参数不匹配或请求失败
   */
  audit (coinId: string, auditTime: number): Promise<Audit>;
  /**
   * 查询审计单
   * @param auditId 审计号
   * @throws 参数不匹配或请求失败
   */
  getAudit (auditId: string): Promise<Audit>;
  /**
   * 查询某个币种的瑶池余额信息
   * @param coinId 币种简称唯一代号
   * @throws 参数不匹配或请求失败
   */
  getBalance (coinId: string): Promise<BalanceData>;
  /**
   * HSM密码机专属，递交代币验证信息
   * @param coinId 币种简称唯一代号
   * @param coinType 代币算法类型
   * @param chain 区块链名称
   * @param token 同coinId
   * @param decimal 该代币小数位数
   * @param contract 可选，该代币的合约地址
   * @returns 是否完成递交
   * @throws 无authKey
   * @throws 参数不匹配或请求失败
   */
  authCoin (coinId: string, coinType: string, chain: string, token: string, decimal: number, contract?: string): Promise<boolean>;
}

export = Api;