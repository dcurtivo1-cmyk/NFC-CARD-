import { QRCodeSVG } from "qrcode.react";
import { cardTextLines } from "../lib/physical-card";
import { physicalCardStyle } from "../data/physical-card";

function CardText({
  value,
  x,
  y,
  width,
  size = 3,
  limit = 32,
  maxLines = 2,
  ...props
}) {
  return cardTextLines(value, limit, maxLines).map((line, i) => (
    <text
      key={i}
      x={x}
      y={y + i * size * 1.2}
      fontSize={size}
      textLength={
        Array.from(line).length * size * 0.62 > width ? width : undefined
      }
      lengthAdjust="spacingAndGlyphs"
      {...props}
    >
      {line}
    </text>
  ));
}

function TapIcon({ x, y, color }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke={color}
      strokeWidth="0.55"
      strokeLinecap="round"
      aria-label="NFC tap icon"
    >
      <rect x="0" y="1.5" width="3.4" height="5.5" rx="0.6" />
      <path d="M5 3a2 2 0 0 1 0 3 M6.7 1.5a4 4 0 0 1 0 6 M8.5 0a6 6 0 0 1 0 9" />
    </g>
  );
}

function Logo({ src, x, y, size = 11 }) {
  return src ? (
    <image
      href={src}
      x={x}
      y={y}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Business logo"
    />
  ) : null;
}

function TapSyncBrand({ background }) {
  const channels = background
    .match(/[a-f\d]{2}/gi)
    .map((part) => parseInt(part, 16));
  const dark =
    channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114 < 140;
  return (
    <g aria-label="TapSync brand">
      {dark && (
        <rect
          x="62.8"
          y="45.5"
          width="17.3"
          height="5.2"
          rx="0.8"
          fill="#ffffff"
        />
      )}
      <svg
        x="64"
        y="46"
        width="15"
        height="4.5"
        viewBox="30 180 450 150"
        preserveAspectRatio="xMaxYMid meet"
        overflow="hidden"
        role="img"
        aria-label="TapSync logo"
      >
        <image
          href={`${import.meta.env.BASE_URL}TapSync_NFC_Sync.png`}
          width="500"
          height="500"
        />
      </svg>
    </g>
  );
}

function Decoration({ style, front }) {
  const { id, accent } = style;
  if (id === "classic")
    return (
      <>
        <rect x="-3" y="-3" width="5" height="59.98" fill={accent} />
        <path d="M7 49H29" stroke={accent} strokeWidth="0.7" />
        <path
          d="M60-3 89 26 M67-3 89 19 M74-3 89 12"
          stroke={accent}
          strokeOpacity="0.13"
          strokeWidth="0.45"
        />
      </>
    );
  if (id === "midnight")
    return (
      <>
        <path
          d="M7 4H4V14 M71 4H81.6V14 M4 40V49.98H14 M71 49.98H81.6V40"
          fill="none"
          stroke={accent}
          strokeWidth="0.35"
        />
        {[0, 5, 10, 15].map((offset) => (
          <path
            key={offset}
            d={`M${57 + offset} -3L88.6 ${28 - offset} M${62 + offset} 56.98L88.6 ${31 + offset}`}
            stroke={accent}
            strokeOpacity="0.13"
            strokeWidth="0.3"
          />
        ))}
        {front && <path d="M7 22H19" stroke={accent} strokeWidth="0.45" />}
      </>
    );
  if (id === "minimal")
    return (
      <>
        <path
          d={front ? "M7 40H78.6" : "M29.3 13H56.3"}
          stroke={accent}
          strokeWidth="0.2"
          strokeOpacity="0.3"
        />
        {front && <circle cx="8" cy="9" r="1" fill={accent} />}
      </>
    );
  if (id === "split")
    return front ? (
      <>
        <rect x="-3" y="-3" width="27" height="59.98" fill={accent} />
        <path
          d="M19-3V56.98"
          stroke={style.brandText}
          strokeWidth="0.25"
          strokeOpacity="0.18"
        />
        <path d="M30 49H44" stroke={accent} strokeWidth="0.8" />
      </>
    ) : (
      <>
        <rect x="-3" y="-3" width="8" height="59.98" fill={accent} />
        <rect x="80.6" y="-3" width="8" height="59.98" fill={accent} />
      </>
    );
  if (id === "wave")
    return (
      <>
        <path
          d="M-3 41C24 32 57 64 88.6 32V57H-3Z"
          fill={accent}
          fillOpacity="0.09"
        />
        <path
          d="M-3 49C24 39 57 69 88.6 41V57H-3Z"
          fill={accent}
          fillOpacity="0.14"
        />
        <path
          d="M-3 53C24 43 57 73 88.6 46"
          fill="none"
          stroke={accent}
          strokeWidth="0.45"
        />
        <circle cx="86" cy="-4" r="23" fill={accent} fillOpacity="0.07" />
      </>
    );
  return (
    <>
      <rect
        x="3"
        y="3"
        width="79.6"
        height="47.98"
        rx="0.8"
        fill="none"
        stroke={accent}
        strokeWidth="0.35"
      />
      <path d="M36 3H49.6 M36 50.98H49.6" stroke={accent} strokeWidth="1" />
      {!front && (
        <path d="M7 19V35 M78.6 19V35" stroke={accent} strokeWidth="0.3" />
      )}
    </>
  );
}

function Front({ details: d, style }) {
  const split = style.id === "split";
  const centered = style.id === "outline";
  const minimal = style.id === "minimal";
  const name = d.fullName || "Your full name";
  const x = centered ? 42.8 : split ? 30 : 7;
  const nameY = centered ? 30 : minimal ? 23 : split ? 27 : 30;
  const nameWidth = split ? 48 : centered ? 68 : 70;
  return (
    <>
      {centered ? (
        <>
          <Logo src={d.logo} x={37.8} y={6} size={10} />
          <CardText
            value={d.businessName}
            x={42.8}
            y={d.logo ? 20 : 13}
            width={53}
            size={2.6}
            limit={32}
            maxLines={1}
            textAnchor="middle"
          />
        </>
      ) : split ? (
        <>
          <Logo src={d.logo} x={6} y={9} size={12} />
          <CardText
            value={d.businessName}
            x={12}
            y={d.logo ? 28 : 16}
            width={17}
            size={2.5}
            limit={12}
            maxLines={3}
            textAnchor="middle"
            fill={style.brandText}
          />
        </>
      ) : minimal ? (
        <>
          <Logo src={d.logo} x={7} y={43} size={6} />
          <CardText
            value={d.businessName}
            x={d.logo ? 16 : 7}
            y={47}
            width={44}
            size={2.5}
            limit={32}
            maxLines={1}
          />
        </>
      ) : (
        <>
          <Logo src={d.logo} x={7} y={7} />
          <CardText
            value={d.businessName}
            x={d.logo ? 22 : 7}
            y={12}
            width={d.logo ? 40 : 55}
            size={2.7}
            limit={28}
          />
        </>
      )}
      <TapIcon
        x={69}
        y={7}
        color={style.id === "midnight" ? style.accent : style.text}
      />
      <CardText
        value={name}
        x={x}
        y={nameY}
        width={nameWidth}
        size={centered ? 4.6 : split ? 4.8 : 5.2}
        limit={split ? 23 : 30}
        maxLines={2}
        textAnchor={centered ? "middle" : "start"}
        fontFamily={
          style.id === "midnight" || centered
            ? "Georgia, serif"
            : "Arial, sans-serif"
        }
        fontWeight={style.id === "midnight" || centered ? "400" : "700"}
      />
      <CardText
        value={d.position}
        x={x}
        y={minimal ? 36 : 41}
        width={nameWidth}
        size={2.8}
        limit={split ? 28 : 40}
        maxLines={minimal ? 1 : 2}
        textAnchor={centered ? "middle" : "start"}
      />
      {!centered && (
        <text
          x="78.6"
          y={20}
          fontSize="1.65"
          letterSpacing="0.2"
          textAnchor="end"
          fill={style.id === "midnight" ? style.accent : style.text}
        >
          TAP TO CONNECT
        </text>
      )}
    </>
  );
}

export default function PhysicalCardArtwork({
  document,
  side,
  url,
  svgRef,
  thumbnail = false,
}) {
  const { details, design } = document;
  const front = side === "front";
  const style = physicalCardStyle(design);
  return (
    <svg
      ref={svgRef}
      className={
        thumbnail ? "physical-card-thumbnail" : "physical-card-artwork"
      }
      data-template={style.id}
      data-side={side}
      xmlns="http://www.w3.org/2000/svg"
      width="85.6mm"
      height="53.98mm"
      viewBox="0 0 85.6 53.98"
      role="img"
      aria-label={`Physical NFC card ${side} for ${details.fullName || "your name"}`}
      fontFamily="Arial, sans-serif"
      fill={style.text}
    >
      <title>{`Physical NFC card — ${side} — ${details.fullName || "Your full name"}`}</title>
      <desc>
        Trim size 85.6 × 53.98 mm. Downloads include 3 mm bleed on each edge.
      </desc>
      <rect x="-3" y="-3" width="91.6" height="59.98" fill={style.background} />
      <Decoration style={style} front={front} />
      {front ? (
        <Front details={details} style={style} />
      ) : (
        <>
          <CardText
            value={details.fullName || "Your full name"}
            x={42.8}
            y={10}
            width={70}
            size={3.4}
            maxLines={1}
            textAnchor="middle"
            fontWeight="700"
          />
          <TapIcon
            x={12}
            y={24}
            color={style.id === "midnight" ? style.accent : style.text}
          />
          <Logo src={details.logo} x={65} y={24} />
          {url ? (
            <QRCodeSVG
              data-card-qr="true"
              x={29.3}
              y={16}
              value={url}
              size={27}
              level="M"
              marginSize={4}
              bgColor="#ffffff"
              fgColor="#000000"
              title="Scan to open your published profile"
            />
          ) : (
            <g>
              <rect
                x="29.3"
                y="16"
                width="27"
                height="27"
                fill="#ffffff"
                stroke="#d6d6d6"
                strokeWidth="0.25"
              />
              <text
                x="42.8"
                y="28"
                textAnchor="middle"
                fontSize="2.6"
                fill="#555555"
              >
                QR after
              </text>
              <text
                x="42.8"
                y="32"
                textAnchor="middle"
                fontSize="2.6"
                fill="#555555"
              >
                publishing
              </text>
            </g>
          )}
          <text
            x="42.8"
            y="48"
            textAnchor="middle"
            fontSize="2.1"
            letterSpacing="0.15"
          >
            TAP OR SCAN TO CONNECT
          </text>
        </>
      )}
      <TapSyncBrand background={style.background} />
    </svg>
  );
}
