export default function KnockOrderLandingPage() {
    return (
        <>
            <title>Knock Order – Land Page</title>
            <link href="https://fonts.googleapis.com/css2?family=Ruda:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            <style>{`
          .ko-land-page-wrapper {
            width: 1440px;
            height: 823px;
            overflow: hidden;
            font-family: 'Ruda', sans-serif;
            background: #0a0f1c;
            margin: 0 auto;
            position: relative;
          }

          .ko-land-page-wrapper *, .ko-land-page-wrapper *::before, .ko-land-page-wrapper *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          .ko-land-page {
            position: relative;
            width: 1440px;
            height: 823px;
            background: #fff;
            overflow: hidden;
          }

          .ko-bg-image {
            position: absolute;
            top: 0; left: 0;
            width: 1440px;
            height: 823px;
            object-fit: cover;
            pointer-events: none;
            z-index: 0;
          }

          .ko-logo-wrap {
            position: absolute;
            left: 50%;
            top: -13px;
            transform: translateX(-50%);
            width: 350px;
            height: 200px;
            z-index: 10;
            overflow: hidden;
          }
          .ko-logo-wrap img {
            width: 100%; height: 100%;
            object-fit: cover;
          }

          .ko-enter-banner {
            position: absolute;
            left: 50%;
            top: 181px;
            transform: translateX(-50%);
            width: 400px;
            height: 122px;
            z-index: 10;
            overflow: hidden;
          }
          .ko-enter-banner img {
            position: absolute;
            width: 103.14%;
            height: 192.7%;
            left: -3.11%;
            top: -43.26%;
          }
          .ko-enter-label {
            position: absolute;
            left: 619px;
            top: 228px;
            font-size: 24px;
            font-weight: 800;
            color: #f2d7b5;
            white-space: nowrap;
            z-index: 20;
            letter-spacing: 1px;
          }

          .ko-left-tab {
            position: absolute;
            left: -8px;
            top: 218px;
            width: 22.5px;
            height: 305px;
            z-index: 10;
          }
          .ko-left-tab img { width: 100%; height: 100%; }

          .ko-nav-btn {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 6px;
            height: 40px;
            width: 174px;
            padding: 0 9px;
            z-index: 15;
            cursor: pointer;
            text-decoration: none;
          }
          .ko-nav-btn .ko-btn-bg {
            position: absolute;
            inset: 0;
            width: 100%; height: 100%;
            object-fit: fill;
          }
          .ko-nav-btn .ko-btn-icon {
            position: relative;
            z-index: 1;
            width: 20px; height: 20px;
            flex-shrink: 0;
            object-fit: contain;
          }
          .ko-nav-btn .ko-btn-label {
            position: relative;
            z-index: 1;
            font-size: 16px;
            font-weight: 500;
            white-space: nowrap;
          }

          .ko-btn-create { left: 37px; top: 259px; }
          .ko-btn-create .ko-btn-label { color: #fff; }

          .ko-btn-join      { left: 37px; top: 307px; }
          .ko-btn-story     { left: 37px; top: 355px; }
          .ko-btn-community { left: 37px; top: 403px; }
          .ko-btn-join .ko-btn-label,
          .ko-btn-story .ko-btn-label,
          .ko-btn-community .ko-btn-label { color: #b9e7f4; }

          .ko-right-tab {
            position: absolute;
            right: 17px;
            top: 218px;
            width: 22.5px;
            height: 305px;
            z-index: 10;
            transform: rotate(180deg);
          }
          .ko-right-tab img { width: 100%; height: 100%; }

          .ko-scrollbar-track {
            position: absolute;
            left: 1375px; top: 225px;
            width: 5px; height: 373px;
            background: #1f2c44;
            border-radius: 4px;
            z-index: 10;
          }
          .ko-scrollbar-thumb {
            position: absolute;
            left: 1375px; top: 225px;
            width: 5px; height: 82px;
            background: #60a5ce;
            border-radius: 4px;
            z-index: 11;
          }

          .ko-news-panel {
            position: absolute;
            left: 1114px;
            top: 181px;
            width: 274px;
            z-index: 10;
          }

          .ko-news-heading-img {
            position: absolute;
            left: 1114px;
            top: 181px;
            width: 274px;
            height: 35px;
            z-index: 11;
          }
          .ko-news-heading-img img { width: 100%; height: 100%; object-fit: fill; }
          .ko-news-label {
            position: absolute;
            left: 1130px;
            top: 189px;
            font-size: 16px;
            font-weight: 500;
            color: #fff;
            z-index: 12;
          }

          .ko-news-cards-box {
            position: absolute;
            left: 1114px;
            top: 216px;
            width: 274px;
            height: 406px;
            z-index: 10;
            overflow: hidden;
          }
          .ko-news-cards-box img {
            width: 100%; height: 100%;
            object-fit: fill;
          }

          .ko-news-card-1 {
            position: absolute;
            left: 1130px;
            top: 232px;
            width: 237px;
            z-index: 15;
          }
          .ko-news-card-2 {
            position: absolute;
            left: 1130px;
            top: 437px;
            width: 237px;
            z-index: 15;
          }

          .ko-news-card img.ko-card-img {
            width: 100%;
            aspect-ratio: 1440 / 803;
            object-fit: cover;
            border: 2px solid #60a5ce;
            display: block;
          }
          .ko-news-card-2 img.ko-card-img { aspect-ratio: 1408 / 768; border-color: #56a4cb; }

          .ko-news-card .ko-card-title {
            margin-top: 8px;
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            line-height: 1.3;
          }

          .ko-news-divider {
            position: absolute;
            left: 1129px;
            top: 419px;
            width: 238px;
            height: 2px;
            background: rgba(96,165,206,0.4);
            z-index: 16;
          }

          .ko-social-btn-bg {
            position: absolute;
            left: 40px;
            top: 707px;
            width: 171px;
            height: 37px;
            z-index: 10;
          }
          .ko-social-btn-bg img { width: 100%; height: 100%; object-fit: fill; }
          .ko-social-label {
            position: absolute;
            left: 64px;
            top: 716px;
            font-size: 16px;
            font-weight: 700;
            color: #b9e7f4;
            white-space: nowrap;
            z-index: 11;
          }

          .ko-social-icons-row {
            position: absolute;
            left: 40px;
            top: 744px;
            width: 379px;
            height: 52px;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ko-social-icons-row img {
            width: 379px; height: 52px;
            object-fit: fill;
            transform: scaleY(-1);
          }
        `}</style>

            <div className="bg-[#0a0f1c] min-h-screen flex items-center justify-center">
                <div className="ko-land-page-wrapper">
                    <div className="ko-land-page">

                        <img className="ko-bg-image"
                            src="https://www.figma.com/api/mcp/asset/8be8713a-c846-404b-87d7-f55e008bb9dc"
                            alt="background" />

                        <div className="ko-logo-wrap">
                            <img src="https://www.figma.com/api/mcp/asset/33ef3dcf-f298-49e8-8ea8-4d005e8b75ed" alt="Knock Order Logo" />
                        </div>

                        <div className="ko-logo-wrap" style={{ zIndex: 11 }}>
                            <img src="https://www.figma.com/api/mcp/asset/33ef3dcf-f298-49e8-8ea8-4d005e8b75ed" alt="" />
                        </div>

                        <div className="ko-enter-banner">
                            <img src="https://www.figma.com/api/mcp/asset/ba0c1501-7180-4325-8187-45cfee761eb0" alt="" />
                        </div>
                        <span className="ko-enter-label">ENTER THE ORDER</span>

                        <div className="ko-left-tab">
                            <img src="https://www.figma.com/api/mcp/asset/45b3238d-e8d3-44d6-bf40-325564d8afa8" alt="" />
                        </div>

                        <a className="ko-nav-btn ko-btn-create" href="#">
                            <img className="ko-btn-bg" src="https://www.figma.com/api/mcp/asset/eaed3d07-5db4-4aa5-af75-6851f50fce11" alt="" />
                            <img className="ko-btn-icon" src="https://www.figma.com/api/mcp/asset/9f4aee9d-3b71-445f-8b61-ba6a0ea24b65" alt="" />
                            <span className="ko-btn-label">CREATE MATCH</span>
                        </a>

                        <a className="ko-nav-btn ko-btn-join" href="#">
                            <img className="ko-btn-bg" src="https://www.figma.com/api/mcp/asset/dd670df0-414d-4c33-b2ea-e7b22d9ad668" alt="" />
                            <img className="ko-btn-icon" src="https://www.figma.com/api/mcp/asset/04584118-8195-41d8-9f99-a4b23a3b2c47" alt="" />
                            <span className="ko-btn-label">JOIN MATCH</span>
                        </a>

                        <a className="ko-nav-btn ko-btn-story" href="#">
                            <img className="ko-btn-bg" src="https://www.figma.com/api/mcp/asset/dd670df0-414d-4c33-b2ea-e7b22d9ad668" alt="" />
                            <img className="ko-btn-icon" src="https://www.figma.com/api/mcp/asset/a1f07e48-9fea-4a72-95bd-109328f21a90" alt="" />
                            <span className="ko-btn-label">STORY</span>
                        </a>

                        <a className="ko-nav-btn ko-btn-community" href="#">
                            <img className="ko-btn-bg" src="https://www.figma.com/api/mcp/asset/dd670df0-414d-4c33-b2ea-e7b22d9ad668" alt="" />
                            <img className="ko-btn-icon" src="https://www.figma.com/api/mcp/asset/64927c15-eb85-43b3-a9a3-54e44664169b" alt="" />
                            <span className="ko-btn-label">COMMUNITY</span>
                        </a>

                        <div className="ko-news-heading-img">
                            <img src="https://www.figma.com/api/mcp/asset/935e9076-a5c3-4ae2-be56-4e67cad95581" alt="" />
                        </div>
                        <span className="ko-news-label">News</span>

                        <div className="ko-news-cards-box">
                            <img src="https://www.figma.com/api/mcp/asset/935e9076-a5c3-4ae2-be56-4e67cad95581" alt="" />
                        </div>

                        <div className="ko-news-card ko-news-card-1">
                            <img className="ko-card-img"
                                src="https://www.figma.com/api/mcp/asset/04d8ca8c-1cc3-4fac-b29f-3dff98dcc8ec"
                                alt="Season 1: Order Ascension" />
                            <div className="ko-card-title">
                                <p>SEASON 1: ORDER ASCENSION</p>
                                <p>NOW LIVE!</p>
                            </div>
                        </div>

                        <div className="ko-news-divider"></div>

                        <div className="ko-news-card ko-news-card-2">
                            <img className="ko-card-img"
                                src="https://www.figma.com/api/mcp/asset/8508603b-14e7-41f3-b149-a6efd308b6ed"
                                alt="New Character Reveal" />
                            <div className="ko-card-title">NEW CHARACTER REVEAL: KAZUMA, THE BLAZING SWORD</div>
                        </div>

                        <div className="ko-right-tab">
                            <img src="https://www.figma.com/api/mcp/asset/ba7a6101-615a-46c2-add5-76896d4b807a" alt="" />
                        </div>

                        <div className="ko-scrollbar-track"></div>
                        <div className="ko-scrollbar-thumb"></div>

                        <div className="ko-social-btn-bg">
                            <img src="https://www.figma.com/api/mcp/asset/346f3dfc-28d0-49ab-a415-c57d8fd7a38c" alt="" />
                        </div>
                        <span className="ko-social-label">SOCIAL MEDIA</span>

                        <div className="ko-social-icons-row">
                            <img src="https://www.figma.com/api/mcp/asset/194544c7-b4b1-4d12-ac34-35b2390ecc67" alt="Social media icons" />
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
