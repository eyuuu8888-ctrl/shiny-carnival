interface Props {
  onClick: () => void;
  title?: string;
}

export function FloatButton({ onClick, title = '总结本帖' }: Props) {
  return (
    <button type="button" class="lds-float-btn" onClick={onClick} title={title} aria-label={title}>
      AI
    </button>
  );
}
