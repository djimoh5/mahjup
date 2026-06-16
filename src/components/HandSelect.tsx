import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import { handData, SegmentColor } from '../data/hands';

const SEGMENT_COLORS: Record<SegmentColor, string> = {
  green: '#2e7d32',
  blue: '#020736',
  red: '#c62828',
};

interface HandSelectProps {
  category: string;
  hand: string;
  onChange: (category: string, hand: string, score: number) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const CATEGORIES = Object.keys(handData);

export default function HandSelect({ category, hand, onChange, size = 'small', fullWidth }: HandSelectProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const open = Boolean(anchorEl);

  const selectedEntry = category && hand ? (handData[category] ?? []).find(item => item.h === hand) : null;

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setActiveCategory(category || CATEGORIES[0]);
    setAnchorEl(e.currentTarget);
  }

  function handleSelectHand(cat: string, h: string, v: number) {
    onChange(cat, h, v);
    setAnchorEl(null);
  }

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
          {selectedEntry?.s ? (
            <>
              {selectedEntry.s.map((seg, i) => (
                <React.Fragment key={i}>
                  {i > 0 && ' '}
                  <span style={{ color: seg.c ? SEGMENT_COLORS[seg.c] : 'inherit', fontWeight: seg.c ? 700 : undefined }}>
                    {seg.t}
                  </span>
                </React.Fragment>
              ))}
            </>
          ) : (hand || 'Hand…')}
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
        slotProps={{
          paper: { sx: { overflow: 'hidden' } },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', width: 460, maxWidth: 'calc(100vw - 32px)', height: 380, overflow: 'hidden' }}>
          {/* Category column */}
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
                onMouseEnter={() => setActiveCategory(cat)}
                onClick={() => setActiveCategory(cat)}
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

          {/* Hand column */}
          <MenuList sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
            {(handData[activeCategory] ?? []).map(item => (
              <MenuItem
                key={item.h}
                selected={item.h === hand && activeCategory === category}
                onClick={() => handleSelectHand(activeCategory, item.h, item.v)}
                sx={{ fontSize: '0.8125rem', whiteSpace: 'normal', lineHeight: 1.4, fontFamily: 'monospace' }}
              >
                {item.s ? (
                  <span>
                    {item.s.map((seg, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && ' '}
                        <span style={{ color: seg.c ? SEGMENT_COLORS[seg.c] : 'inherit', fontWeight: seg.c ? 700 : undefined }}>
                          {seg.t}
                        </span>
                      </React.Fragment>
                    ))}
                    {item.s2 && (
                      <>
                        <span style={{ color: '#888', fontWeight: 400 }}> -or- </span>
                        {item.s2.map((seg, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && ' '}
                            <span style={{ color: seg.c ? SEGMENT_COLORS[seg.c] : 'inherit', fontWeight: seg.c ? 700 : undefined }}>
                              {seg.t}
                            </span>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </span>
                ) : item.h}
              </MenuItem>
            ))}
          </MenuList>
        </Box>
      </Popover>
    </>
  );
}
