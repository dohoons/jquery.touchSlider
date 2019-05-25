# jquery.touchSlider
- jQuery 기반의 플리킹 내비게이션 플러그인
- 마크업 요소 선택에 제약이 없으며 초보자도 쉽게 사용하도록 설계
- CSS Selector에 따라 다중 적용 가능
- PC 브라우저에서 드래그로 사용가능 (기본 옵션으로 포함 v1.3.0)
- jQuery 1.7+, IE7+ 지원

## Demo
http://dohoons.com/test/flick

## 설치 방법

### \<script\> 태그로 웹페이지에 추가
``` html
<script src="jquery.touchSlider.js"></script>
```

### 또는 NPM으로 설치해서 사용

``` sh
$ npm i jquery.touchslider
```
``` js
var $ = require('jquery');
require('jquery.touchslider')($);
```

## 기본 사용법
``` css
#touchSlider { background:#ccc; position:relative; overflow:hidden; }
#touchSlider ul { position:absolute; top:0; left:0; overflow:hidden; }
#touchSlider ul li { height:150px; background:#9C9; font-size:14px; color:#fff; }
```

``` html
<div id="touchSlider">
	<ul>
		<li style="background:#9C9">content 1</li>
		<li style="background:#396">content 2</li>
		<li style="background:#39C">content 3</li>
		<li style="background:#33C">content 4</li>
	</ul>
</div>
```

``` js
$("#touchSlider").touchSlider({
	// ... Options
	page: 2
});
```

## Options

| Option Name | Defaut | Description |
| --- | --- | --- |
| mode | 'swipe' | 슬라이드 모드 ('swipe' or 'fade') |
| useMouse | true | 마우스 드래그 사용 여부 |
| page | 1 | 초기 페이지 |
| roll | true | 슬라이드 넘김 순환 |
| resize | true | 자동 리사이즈 |
| view | 1 | 페이지 당 아이템 개수 |
| gap | 0 | 아이템 사이 간격 (pixel) |
| speed | 150 | 페이지 넘김 애니메이션 속도 (ms) |
| controls | true | prev, next 버튼 생성 |
| paging | true | page control 생성 |
| btn_prev | null | 사용자 prev 버튼 (jQuery Objec) |
| btn_next | null | 사용자 next 버튼 (jQuery Objec) |
| sidePage | false | 측면 페이지 사용 |
| transition | true | CSS Transition 사용 |
| range | 0.15 | 페이지 넘김 판정 범위 |
| autoplay | Object | 자동움직임 관련 옵션 (Object) |
| breakpoints | null | 브레이크 포인트 옵션 |

## Method

| Name | Description |
| --- | --- |
| go_page(index) | index 페이지로 이동 |
| autoPlay() | 자동 넘김 시작  |
| autoStop() | 자동 넘김 정지  |
| autoPauseToggle() | 자동 넘김 시작/정지 토글  |

## CallBack

| Name | Description |
| --- | --- |
| initComplete | 슬라이더가 초기화된 후 시작 |
| counter | 슬라이더를 넘긴 후 시작  |