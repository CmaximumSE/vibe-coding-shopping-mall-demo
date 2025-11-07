import { Link } from 'react-router-dom';

const Home = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">홈페이지</h1>
    <Link to="/register" className="btn-primary inline-block">
      회원가입
    </Link>
  </div>
);

export default Home;
