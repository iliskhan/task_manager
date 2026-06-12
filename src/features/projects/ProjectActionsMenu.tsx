import MoreVert from '@mui/icons-material/MoreVert';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { type MouseEvent, useState } from 'react';
import type { ProjectListItem } from './projectTypes';

type ProjectActionsMenuProps = {
  project: ProjectListItem;
  isOwner: boolean;
  onEdit: (project: ProjectListItem) => void;
  onArchive: (project: ProjectListItem) => void;
  isArchivePending?: boolean;
};

export function ProjectActionsMenu({
  project,
  isOwner,
  onEdit,
  onArchive,
  isArchivePending = false,
}: ProjectActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!isOwner) {
    return null;
  }

  const isOpen = Boolean(anchorEl);

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    closeMenu();
    onEdit(project);
  };

  const handleArchive = () => {
    closeMenu();
    onArchive(project);
  };

  return (
    <>
      <IconButton
        aria-label={`Действия проекта ${project.name}`}
        onClick={openMenu}
        sx={{
          justifySelf: { xs: 'start', lg: 'end' },
          mt: { xs: -1, lg: 0 },
        }}
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редактировать</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleArchive} disabled={isArchivePending || Boolean(project.archived_at)}>
          <ListItemIcon>
            <ArchiveOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Архивировать</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
