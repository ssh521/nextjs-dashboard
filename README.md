# Next.js 대시보드 애플리케이션 (학습용)

website : https://next.doker.co.kr
blog : https://digitalogia.tistory.com/543

Synology Docker 에서 next.js 를 테스트 하기 위해서 만든 코드입니다. 

## 주요 기능

- **인증 시스템**: NextAuth를 사용한 이메일/비밀번호 기반 로그인 및 회원가입
- **고객 관리**: 고객 정보 조회, 생성, 수정 기능
- **인보이스 관리**: 인보이스 생성, 수정, 상태 관리 (pending/paid)
- **대시보드**: 수익 통계, 차트, 최신 인보이스 목록 등 시각화
- **반응형 디자인**: 모바일 및 데스크톱 환경 지원

## 기술 스택

- **프레임워크**: Next.js (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **인증**: NextAuth v5
- **데이터베이스**: MySQL (mysql2)
- **패키지 관리**: pnpm
- **배포**: Docker 지원

## 시작하기

### 필수 요구사항

- Node.js 20 이상
- pnpm
- MySQL 데이터베이스

### 설치 및 실행

1. 의존성 설치:
```bash
pnpm install
```

2. 환경 변수 설정:
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=nextjs_dashboard
AUTH_SECRET=your_auth_secret
```

3. 개발 서버 실행:
```bash
pnpm dev
```

4. 프로덕션 빌드:
```bash
pnpm build
pnpm start
```

## Docker 사용

Docker Compose를 사용하여 실행할 수 있습니다:

```bash
cd compose
docker-compose up
```

## 프로젝트 구조

```
app/
├── dashboard/          # 대시보드 페이지
│   ├── (overview)/     # 대시보드 오버뷰
│   ├── customers/      # 고객 관리 페이지
│   └── invoices/       # 인보이스 관리 페이지
├── login/              # 로그인 페이지
├── register/           # 회원가입 페이지
├── lib/                # 유틸리티 및 데이터 함수
└── ui/                 # 재사용 가능한 UI 컴포넌트
```

## 참고 자료

더 자세한 정보는 [Next.js 학습 과정](https://nextjs.org/learn)을 참고하세요.
