export default (absTmpPath: string) => `
import React from 'react';
import { getRoutes } from '${absTmpPath}/core/routes';
import { setLayoutInstance } from './KeepAliveModel';
import pathToRegexp from 'path-to-regexp';
import { matchRoutes } from 'react-router-config';
const isKeepPath = (aliveList:any[],path:string)=>{
  let isKeep = false;
  aliveList.map(item=>{
    if(item === path){
      isKeep = true;
    }
    if(item instanceof RegExp && item.test(path)){
      isKeep = true;
    }
    if(typeof item === 'string' && item.toLowerCase() === path){
      isKeep = true;
    }
  })
  return isKeep;
}
const getKeepAliveViewMap = (routeList:any[],aliveList:any[])=>{
  let keepAliveMap = {};
  function find(routess: any[], list:any[]) {
    if(!routess|| !list ){
      return routess;
    }
    return routess.map(element => {
      if (!Array.isArray(element.routes)&&isKeepPath(list,element.path?element.path.toLowerCase():'')) {
        element.recreateTimes = 0;
        keepAliveMap[element.path.toLowerCase()] = element;
      }else{
        element.routes = find(element.routes,aliveList);
      }
      return element;
    });
  }
  find(routeList,aliveList)
  return keepAliveMap;
}
const getView = (
  pathname: string,
  keepAliveViewMap: { [key: string]: any },
) => {
  let View;
  for (const key in keepAliveViewMap) {
    if (pathToRegexp(key).test(pathname)) {
      View = keepAliveViewMap[key]
      break;
    }
  }
  return View;
};
interface PageProps {
  location: {
    pathname: string;
  };
}
export default class BasicLayout extends React.PureComponent<PageProps> {
  constructor(props: any) {
    super(props);
    this.keepAliveViewMap = getKeepAliveViewMap(getRoutes(),props.keepalive);
  }
  componentDidMount() {
    setLayoutInstance(this);
  }

  keepAliveViewMap = {};

  alivePathnames: string[] = [];

  render() {
    const {
      location: { pathname },
    } = this.props;
    const showKeepAlive = !!getView(pathname, this.keepAliveViewMap);
    if (showKeepAlive) {
      const index = this.alivePathnames.findIndex(
        tPathname => tPathname === pathname.toLowerCase(),
      );
      if (index === -1) {
        this.alivePathnames.push(pathname.toLowerCase());
      }
    }
    return (
      <>
        {this.alivePathnames.map(curPathname => {
          const currentView = getView(curPathname, this.keepAliveViewMap);
          const { component: View, recreateTimes } = currentView;
          const matchRoute = matchRoutes([currentView], curPathname)[0];
          const pageProps: any = { ...this.props,...matchRoute };
          return View ? (
            <div
              id={\`BasicLayout-\${curPathname}\`}
              key={
                curPathname + recreateTimes
              }
              style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden auto' }}
              className="rumtime-keep-alive-layout"
              hidden={curPathname !== pathname.toLowerCase()}
            >
              <View {...pageProps} />
            </div>
          ) : null;
        })}
        <div hidden={showKeepAlive} style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden auto' }} className="rumtime-keep-alive-layout-no">
          {!showKeepAlive && this.props.children}
        </div>
      </>
    )
  }
}
`;
