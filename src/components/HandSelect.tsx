import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { handData, HandEntry, HandSegment, SegmentColor } from '../data/hands';

const SEGMENT_COLORS: Record<SegmentColor, string> = {
  green: '#2e7d32',
  blue: '#020736',
  red: '#c62828',
};

interface HandSelectProps {
  category: string;
  hand: string;
  variant?: 's2';
  onChange: (category: string, hand: string, score: number, variant?: 's2') => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const CATEGORIES = Object.keys(handData);

function Segments({ segs }: { segs: HandSegment[] }) {
  return (
    <>
      {segs.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' '}
          <span style={{ color: seg.c ? SEGMENT_COLORS[seg.c] : 'inherit', fontWeight: seg.c ? 700 : undefined }}>
            {seg.t}
          </span>
        </React.Fragment>
      ))}
    </>
  );
}

export default function HandSelect({ category, hand, variant, onChange, size = 'small', fullWidth }: HandSelectProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [pendingItem, setPendingItem] = useState<HandEntry | null>(null);
  const open = Boolean(anchorEl);
  const isDesktop = useMediaQuery('(hover: hover)');

  const selectedEntry = category && hand ? (handData[category] ?? []).find(item => item.h === hand) : null;
  const displaySegs = variant === 's2' ? (selectedEntry?.s2 ?? selectedEntry?.s) : selectedEntry?.s;

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setActiveCategory(category || CATEGORIES[0]);
    setPendingItem(null);
    setAnchorEl(e.currentTarget);
  }

  function handleSelectHand(cat: string, h: string, v: number, v2?: 's2') {
    onChange(cat, h, v, v2);
    setAnchorEl(null);
    setPendingItem(null);
  }

  function handleCategorySelect(cat: string) {
    setActiveCategory(cat);
    setPendingItem(null);
  }

  const categoryColumn = (
    <MenuList
      sx={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 0.5,
      }}
    >
      {CATEGORIES.map(cat => (
        <MenuItem
          key={cat}
          selected={cat === activeCategory}
          onMouseEnter={() => handleCategorySelect(cat)}
          onClick={() => handleCategorySelect(cat)}
          sx={{
            fontSize: '0.8125rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 0.5,
            pr: 0.5,
            fontWeight: cat === activeCategory ? 600 : 400,
          }}
        >
          <span style={{ flex: 1 }}>{cat}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.4 }}>
            <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </MenuItem>
      ))}
    </MenuList>
  );

  const handList = (
    <MenuList sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
      {(handData[activeCategory] ?? []).map(item => (
        <MenuItem
          key={item.h}
          selected={item.h === hand && activeCategory === category}
          onMouseEnter={() => {
            if (!isDesktop) return;
            if (item.s2) setPendingItem(item);
            else setPendingItem(null);
          }}
          onClick={() => {
            if (item.s2 && !isDesktop) setPendingItem(item);
            else if (!item.s2) handleSelectHand(activeCategory, item.h, item.v);
          }}
          sx={{ fontSize: '0.8125rem', whiteSpace: 'normal', lineHeight: 1.4, fontFamily: 'monospace' }}
        >
          {item.s ? (
            <span>
              <Segments segs={item.s} />
              {item.s2 && (
                <>
                  <span style={{ color: '#888', fontWeight: 400 }}> -or- </span>
                  <Segments segs={item.s2} />
                  <span style={{ color: '#aaa', fontSize: '0.65em', marginLeft: '0.4em', verticalAlign: 'middle' }}>▶</span>
                </>
              )}
            </span>
          ) : item.h}
        </MenuItem>
      ))}
    </MenuList>
  );

  const variantPanel = (
    <Box
      sx={{
        width: 200,
        flexShrink: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        visibility: pendingItem ? 'visible' : 'hidden',
      }}
    >
      <Typography sx={{ px: 1.5, pt: 1, pb: 0.5, fontSize: '0.6875rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Choose version
      </Typography>
      <MenuList sx={{ overflowY: 'auto', py: 0 }}>
        {pendingItem && (
          <MenuItem
            selected={activeCategory === category && hand === pendingItem.h && variant !== 's2'}
            onClick={() => handleSelectHand(activeCategory, pendingItem.h, pendingItem.v)}
            sx={{ fontSize: '0.8125rem', whiteSpace: 'normal', lineHeight: 1.6, fontFamily: 'monospace' }}
          >
            {pendingItem.s && <Segments segs={pendingItem.s} />}
          </MenuItem>
        )}
        {pendingItem?.s2 && (
          <MenuItem
            selected={activeCategory === category && hand === pendingItem.h && variant === 's2'}
            onClick={() => handleSelectHand(activeCategory, pendingItem.h, pendingItem.v, 's2')}
            sx={{ fontSize: '0.8125rem', whiteSpace: 'normal', lineHeight: 1.6, fontFamily: 'monospace' }}
          >
            <Segments segs={pendingItem.s2} />
          </MenuItem>
        )}
      </MenuList>
    </Box>
  );

  const mobileVariantPanel = (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ButtonBase
        onClick={() => setPendingItem(null)}
        aria-label="Back to hand list"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, pt: 0.75, pb: 0.25, borderBottom: '1px solid', borderColor: 'divider', width: '100%', justifyContent: 'flex-start' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
          Choose version
        </Typography>
      </ButtonBase>
      <MenuList sx={{ overflowY: 'auto', py: 0.5 }}>
        {pendingItem?.s && (
          <MenuItem
            selected={activeCategory === category && hand === pendingItem.h && variant !== 's2'}
            onClick={() => handleSelectHand(activeCategory, pendingItem!.h, pendingItem!.v)}
            sx={{ fontSize: '0.8125rem', whiteSpace: 'normal', lineHeight: 1.6, fontFamily: 'monospace' }}
          >
            <Segments segs={pendingItem.s} />
          </MenuItem>
        )}
        {pendingItem?.s2 && (
          <MenuItem
            selected={activeCategory === category && hand === pendingItem.h && variant === 's2'}
            onClick={() => handleSelectHand(activeCategory, pendingItem!.h, pendingItem!.v, 's2')}
            sx={{ fontSize: '0.8125rem', whiteSpace: 'normal', lineHeight: 1.6, fontFamily: 'monospace' }}
          >
            <Segments segs={pendingItem.s2} />
          </MenuItem>
        )}
      </MenuList>
    </Box>
  );

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        sx={{
          width: fullWidth ? '100%' : undefined,
          border: '1px solid',
          borderColor: open ? 'primary.main' : 'rgba(0,0,0,0.23)',
          borderWidth: open ? 2 : 1,
          borderRadius: '4px',
          px: size === 'small' ? '13px' : '15px',
          height: size === 'small' ? '40px' : '56px',
          fontSize: size === 'small' ? '0.875rem' : '1rem',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          textAlign: 'left',
          '&:hover': { borderColor: open ? 'primary.main' : 'rgba(0,0,0,0.87)' },
        }}
      >
        <Box
          component="span"
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: hand ? 'text.primary' : 'text.disabled',
            fontStyle: hand ? 'normal' : 'italic',
            fontFamily: hand ? 'monospace' : 'inherit',
          }}
        >
          {displaySegs ? <Segments segs={displaySegs} /> : (hand || 'Hand…')}
        </Box>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(0,0,0,0.54)" style={{ flexShrink: 0 }}>
          <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
        </svg>
      </ButtonBase>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { overflow: 'hidden' } } }}
      >
        {isDesktop ? (
          <Box sx={{ display: 'flex', flexDirection: 'row', width: 600, maxWidth: 'calc(100vw - 32px)', height: 380, overflow: 'hidden' }}>
            {categoryColumn}
            {handList}
            {variantPanel}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'row', width: 460, maxWidth: 'calc(100vw - 32px)', height: 380, overflow: 'hidden' }}>
            {categoryColumn}
            {pendingItem ? mobileVariantPanel : handList}
          </Box>
        )}
      </Popover>
    </>
  );
}
