/*
 * @Author: duanguang
 * @Date: 2018-05-11 10:49:10
 * @Last Modified by: duanguang
 * @Last Modified time: 2020-10-26 12:04:18
 */
import React from 'react';
import styles from './index.modules.less';
import './style.css';
import styleCss from './style.modules.css';
import test from '../../assets/css/test.less';
console.log(test, styleCss);
import '../index.css';
import ID from '../../public/images/home/ID.png';
console.log(require('../../public/images/home/Backend-E.png'), 111);
export default class HomeManage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { width: '27.9rem', display: 'block' };
    this.delFirstChildStyle = this.delFirstChildStyle.bind(this);
    this.addFirstChildStyle = this.addFirstChildStyle.bind(this);
  }
  componentDidMount() {
    // fetch(`/cia-j/vat-tax/exportExcel`).then((result)=>{
    //   return result;
    // })
  }

  delFirstChildStyle() {
    this.setState({ width: '7.85rem', display: 'none' });
  }

  addFirstChildStyle() {
    this.setState({ width: '27.9rem', display: 'block' });
  }

  render() {
    return (
      <div>
        <section className={styles.container}>
          <section className={styles.content}>
            <div className={styles.title}>
              我们不仅仅是设计1-5{process.env.environment}
            </div>
            <div className={styles.slogan}>
              <p className="style">
                棒谷用户体验中心创立于2018年6月28日，为全球首家跨境电商用户体验中心，
              </p>
              <p className={`${styleCss.modules}`}>
                棒谷用户体验中心创立于2018年6月28日，为全球首家跨境电商用户体验中心，
              </p>
              <p className={'test bg'}>
                我们愿景是成为全球TOP级别客户满意的公司
              </p>
            </div>
            <div className={styles.design}>
              <div className={styles.cate}>
                <div className={styles.transform}>
                  <img src={ID} />
                  <div className={styles.intro}>
                    <div>
                      <p className={styles['intro-title']}>交互设计</p>
                      <p className={styles.small}>Interaction Design</p>
                    </div>
                    <span className="size1">
                      解析产品需求，以人为本分析用户场景
                    </span>
                    <span>在可用性和易用性中寻找设计平衡</span>
                  </div>
                </div>
                <div className={styles.cover}>
                  <img
                    src={require('../../public/images/home/Interactive-D.png')}
                  />
                </div>
              </div>
              <div className={styles.cate}>
                <div className={styles.cover}>
                  <img src={require('../../public/images/home/Visuai-D.png')} />
                </div>
                <div className={styles.transform}>
                  <img src={require('../../public/images/home/VD.png')} />
                  <div className={styles.intro}>
                    <div>
                      <p className={styles['intro-title']}>视觉设计</p>
                      <p className={styles.small}>Visual Design</p>
                    </div>
                    <span>寻求和定义视觉风格，</span>
                    <span>精准传达产品理念，缔造优质感官体验</span>
                  </div>
                </div>
              </div>
              <div className={styles.cate}>
                <div className={styles.cover}>
                  <img
                    src={require('../../public/images/home/Front-end-E.png')}
                  />
                </div>
                <div className={styles.transform}>
                  <img src={require('../../public/images/home/front.png')} />
                  <div className={styles.intro}>
                    <div>
                      <p className={styles['intro-title']}>前端开发</p>
                      <p className={styles.small}>Front end development</p>
                    </div>
                    <span>定义框架内容，</span>
                    <span>确保视觉效果完美呈现、页面方案高效落地</span>
                  </div>
                </div>
              </div>
              <div className={styles.cate}>
                <div className={styles.cover}>
                  <img
                    src={require('../../public/images/home/Backend-E.png')}
                  />
                </div>
                <div className={styles.transform}>
                  <img src={require('../../public/images/home/backend.png')} />
                  <div className={styles.intro}>
                    <div>
                      <p className={styles['intro-title']}>后端技术</p>
                      <p className={styles.small}>Backend technology</p>
                    </div>
                    <span>维护优化系统数据，</span>
                    <span>保障平台高效稳定运行，支撑亿级以上数据量</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className={styles.content}>
            <div className={styles.title}>我们的项目</div>
            <div className={styles.project}>
              <div className={styles.item} style={{ width: this.state.width }}>
                <div className={styles.line} />
                <div className={styles['project-title']}>OA</div>
                <div
                  className={styles.intro}
                  style={{ display: this.state.display }}>
                  <img src={require('../../public/images/home/OA.png')} />
                  <div className={styles['intro-content']}>
                    <div>OA</div>
                    <p>
                      基于“框架+应用组件+功能定制平台”的架构模型，由30多个子系统组成，包括信息门户、协同工作、工作流程、会务管理、任务管理、文档管理、人事管理、集成平台等，近万个功能点。
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={styles.item}
                onMouseEnter={this.delFirstChildStyle}
                onMouseLeave={this.addFirstChildStyle}>
                <div className={styles.line} />
                <div className={styles['project-title']}>SCM</div>
                <div className={styles.intro}>
                  <img src={require('../../public/images/home/SCM.png')} />
                  <div className={styles['intro-content']}>
                    <div>SCM</div>
                    <p>
                      不仅是一条连接供应商到用户的物流链、信息链、资金链，而且是一条增值链，物料在供应链上因加工、包装、运输等过程而增加其价值，给企业带来收益。
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={styles.item}
                onMouseEnter={this.delFirstChildStyle}
                onMouseLeave={this.addFirstChildStyle}>
                <div className={styles.line} />
                <div className={styles['project-title']}>ERP</div>
                <div className={styles.intro}>
                  <img src={require('../../public/images/home/ERP.png')} />
                  <div className={styles['intro-content']}>
                    <div>ERP</div>
                    <p>
                      集信息技术与先进管理思想于一身，以系统化的管理思想，为企业员工及决策层提供决策手段的管理平台。协调各管理部门，围绕市场导向开展业务活动，提高企业的核心竞争力。
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={styles.item}
                onMouseEnter={this.delFirstChildStyle}
                onMouseLeave={this.addFirstChildStyle}>
                <div className={styles.line} />
                <div className={styles['project-title']}>PMC</div>
                <div className={styles.intro}>
                  <img src={require('../../public/images/home/PMC.png')} />
                  <div className={styles['intro-content']}>
                    <div>PMC</div>
                    <p>
                      对生产的计划与生产进度，以及物料的计划、跟踪、收发、存储、使用等各方面的监督与管理和呆滞料的预防处理，主要有两方面工作内容。即PC与MC。
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={styles.item}
                onMouseEnter={this.delFirstChildStyle}
                onMouseLeave={this.addFirstChildStyle}>
                <div className={styles.line} />
                <div className={styles['project-title']}>EWMS</div>
                <div className={styles.intro}>
                  <img src={require('../../public/images/home/EWMS.png')} />
                  <div className={styles['intro-content']}>
                    <div>EWMS</div>
                    <p>
                      具备入库、出库、库存管理、帐务管理、统计分析等基本功能，结合批次、预警、BOM、虚仓、配送管理等功能，帮助企业提高仓储作业效率、提升仓储经营管理水平。
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={styles.item}
                onMouseEnter={this.delFirstChildStyle}
                onMouseLeave={this.addFirstChildStyle}>
                <div className={styles.line} />
                <div className={styles['project-title']}>
                  <p>Sketch</p>
                  <p>Library</p>
                </div>
                <div className={styles.intro}>
                  <img
                    src={require('../../public/images/home/Sketch Library.png')}
                  />
                  <div className={styles['intro-content']}>
                    <div>Sketch Library</div>
                    <p>
                      UI组件是离用户最近的功能性部件，交互基本都通过它们实现。由于不同介质的原生组件数量有限，又存在很多限制，所以需要更丰富的组件来帮助我们的应用突破边界，更好的与用户沟通。
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={styles.item}
                onMouseEnter={this.delFirstChildStyle}
                onMouseLeave={this.addFirstChildStyle}>
                <div className={styles.line} />
                <div className={styles['project-title']}>
                  <p>Activity</p>
                  <p>Template</p>
                </div>
                <div className={styles.intro}>
                  <img
                    src={require('../../public/images/home/Activity Template.png')}
                  />
                  <div className={styles['intro-content']}>
                    <div>Activity Template</div>
                    <p>
                      活动智能模版为了规范banner、日常促销、日常推广等的上线标准，其分成两部分，其一是集成了模块的组合功能，其二是设计师可以在模块精选里直接采用现有的视觉样式，还可以新增新的视觉样式。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className={styles.content}>
            <div className={styles['video-cover']}>
              <div>
                <div className={styles.title}>更懂设计更懂你</div>
                <video controls="controls" width="500" height="300">
                  <source
                    // src="http://transfer.banggood.cn:7053/public/assets/ued/video/UED.mp4"
                    src={`http://transfer.banggood.cn:7053/public/assets/ued/video/UED.mp4`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </section>
        </section>
      </div>
    );
  }
}
