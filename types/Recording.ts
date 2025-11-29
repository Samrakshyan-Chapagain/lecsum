export type Recording = {
  _id?: string;
  userId: string;
  email: string;
  name: string;
  audioUrl: string;
  date?: string | Date;
   summary?: string;
};
