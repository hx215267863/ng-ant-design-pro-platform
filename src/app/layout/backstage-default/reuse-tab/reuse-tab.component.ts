import { Component, OnInit, ViewChild, ElementRef, Output, Renderer, Input, EventEmitter, ViewChildren } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { fromEvent, from } from 'rxjs';
import { NzMenuItemDirective } from 'ng-zorro-antd';
import { SimpleReuseStrategy } from 'src/app/services/core/simple-reuse-strategy';
import { PlatformCoreService } from 'src/app/services/core/platform-core.service';
import { MenuItem } from 'src/app/modes/core/menuItem';

@Component({
  selector: 'app-reuse-tab',
  templateUrl: './reuse-tab.component.html',
  styleUrls: ['./reuse-tab.component.css']
})
export class ReuseTabComponent implements OnInit {

  /**
   * 当前选中的tab
   */
  currentIndex = -1;

  /**
   * 当前鼠标经过的tab
   */
  currentOverIndex = -1;

  /**
   * tab实际容器宽度
   */
  tabRealWidth: any;

  /**
   * 侧边栏宽度
   */
  sidebarWidth: 256;

  /**
   * tab改变时发送回值给外部使用
   */
  @Output() changeTabSize: EventEmitter<number> = new EventEmitter();

  /**
   * 所有缓存的tabItem
   */
  tabItemList: Array<{ title: string, module: string, power: string, isSelect: boolean }> = [];

  /**
   * 显示tabItem
   */
  tabItemShowList: Array<{ title: string, module: string, power: string, isSelect: boolean }> = [];

  /**
   * 折叠菜单
   */
  tabItemCollapsedList: Array<{ title: string, module: string, power: string, isSelect: boolean }> = [];

  /**
   * 是否显示折叠
   */
  isCollapsedTab: boolean;

  menuList = [];

  constructor(
    private hst: ElementRef,
    private platformCoreService: PlatformCoreService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title) {

    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .pipe(map(() => this.activatedRoute))
      .pipe(map((route) => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }))
      .pipe(filter(route => route.outlet === 'primary'))
      .pipe(mergeMap(route => route.data))
      .subscribe(event => {
        // 路由data的标题
        const menu = {...event};
        menu.url = this.router.url;
        const url = menu.url;
        this.titleService.setTitle(menu.title); // 设置网页标题
        const exitMenu = this.menuList.find(info => info.url === url);
        if (!exitMenu) {// 如果不存在那么不添加，
          this.menuList.push(menu);
          this.tabItemList.push({ title: menu.title, module: url, power: '', isSelect: true });
          this.tabResize();
        }
        this.currentIndex = this.menuList.findIndex(p => p.url === url);
      });

  }

  // 关闭选项标签
  closeTab(module: string, isSelect: boolean): void {
    // 当前关闭的是第几个路由
    const index = this.tabItemList.findIndex(p => p.module === module);
    // 如果只有一个不可以关闭
    if (this.tabItemList.length === 1) { return; }

    this.tabItemList = this.tabItemList.filter(p => p.module !== module);
    // 删除复用
    delete SimpleReuseStrategy.handlers[module];
    if (!isSelect) { return; }
    // 显示上一个选中
    let menu = this.tabItemList[index - 1];
    if (!menu) {// 如果上一个没有下一个选中
      menu = this.tabItemList[index + 1];
    }
    // console.log(menu);
    // console.log(this.menuList);
    this.tabItemList.forEach(p => p.isSelect = p.module === menu.module);
    // 显示当前路由信息
    this.router.navigate(['/' + menu.module]);
  }

  ngOnInit() {
    console.log('menulist size:' + this.tabItemList.length);
    fromEvent(window, 'resize')
      .subscribe((event: any) => {
        // 操作
        console.log('页面变化了');
        this.tabResize(this.sidebarWidth);
      });
    this.tabResize(this.sidebarWidth);
  }

  /**
   * 重置tab大小
   * @param sw 侧边栏宽度
   */
  tabResize(sw?: any): void {
    // 初始化变量
    const winWidth = document.body.offsetWidth;
    this.sidebarWidth = sw !== undefined ? sw : 256;
    const sidebarCollapsedWidth = 68;
    const headerWidth = 180;
    const menuDrapDownWidth = 38; // 折叠tab
    const tabItemWidth = 96;
    const tabMaxWidth = winWidth - this.sidebarWidth - sidebarCollapsedWidth - headerWidth - 2; // 这里扣多2像素，貌似有些浏览器有问题
    this.tabRealWidth = tabMaxWidth - menuDrapDownWidth; // tab的实际容器宽度
    this.hst.nativeElement.style.width = tabMaxWidth + 'px'; // 重设宿主组件的宽度
    this.changeTabSize.emit(tabMaxWidth); // 向外发送计算好的值事件
    // 重新显示tab
    const tabMaxNum = Math.floor(this.tabRealWidth / tabItemWidth);
    let tabNum = this.tabItemList.length > tabMaxNum ? tabMaxNum : this.tabItemList.length;
    if (tabNum < 0) {
      tabNum = 0;
    }
    // 清空重新赋值
    this.tabItemShowList = this.tabItemList.slice(0, tabNum);
    this.tabItemCollapsedList = this.tabItemList.slice(tabNum);
    // 显示折叠tab
    if (this.tabItemList.length > tabNum) {
      this.isCollapsedTab = true;
    } else {
      this.isCollapsedTab = false;
    }
  }

  /**
  * tab发生改变
  */
  nzSelectChange(ev: any, index: number): void {
    this.currentIndex = index;
    const menu = this.tabItemList[this.currentIndex];
    // 跳转路由
    this.router.navigate([menu.module]);
  }

  /**
   * 显示关闭
   */
  showClose(tabItem: string, i: number): void {
    this.currentOverIndex = i;
    document.getElementById(tabItem + i).style.display = 'inline-block';
  }

  /**
   * 隐藏关闭
   */
  hideClose(tabItem: string, i: number): void {
    this.currentOverIndex = i;
    document.getElementById(tabItem + i).style.display = 'none';
  }


}
