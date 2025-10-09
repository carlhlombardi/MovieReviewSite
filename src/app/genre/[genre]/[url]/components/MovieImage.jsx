import Image from "next/image";

export default function MovieImage({ image_url, film }) {
  return image_url ? (
    <Image src={image_url} alt={film} width={300} height={450} />
  ) : (
    <div>No image available</div>
  );
}
