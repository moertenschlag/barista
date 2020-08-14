/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const themeSwitch = document.querySelector('.ds-theme-switch');
if (themeSwitch) {
  themeSwitch.addEventListener('click', () => {
    if (document.body.classList.contains('fluid-theme--abyss')) {
      document.body.classList.remove('fluid-theme--abyss');
      document.body.classList.add('fluid-theme--surface');
    } else {
      document.body.classList.add('fluid-theme--abyss');
      document.body.classList.remove('fluid-theme--surface');
    }
  });
}

const mobileSideNavToggle = document.querySelector('.ds-nav-btn-menutoggle');
const sideNav = document.querySelector('.ds-sidenav');

if (sideNav && mobileSideNavToggle) {
  mobileSideNavToggle.addEventListener('click', () => {
    sideNav.classList.toggle('ds-sidebar-active');
    mobileSideNavToggle.classList.toggle('ds-sidenav-btn-active');
  });
}

const menuItems = document.querySelectorAll('.ds-sidenav-menu-item');

for (let i = 0; i < menuItems?.length; i++) {
  let delay = (i + 1) * 0.09;
  menuItems[i].setAttribute('style', `transition-delay: ${delay}s`);
}

const topNav = document.querySelector('.ds-nav-bar');
const topNavScrollIndicator = document.querySelector(
  '.ds-nav-scroll-indicator',
);

if (topNav && topNav.scrollWidth > topNav.clientWidth) {
  topNavScrollIndicator?.classList.add('ds-nav-scroll-indicator-active');

  topNav?.addEventListener('scroll', () => {
    if (topNav.scrollLeft === 0) {
      topNavScrollIndicator?.classList.add('ds-nav-scroll-indicator-active');
    } else {
      topNavScrollIndicator?.classList.remove('ds-nav-scroll-indicator-active');
    }
  });
}
